"""
Voice Runner Backend API
FastAPI server for receiving voice recordings and session data
"""

import os
import json
import uuid
from datetime import datetime
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import boto3
from botocore.config import Config

# Initialize FastAPI
app = FastAPI(
    title="Voice Runner API",
    description="Backend for Caribbean voice data collection game",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",  # Python http.server default
        "https://voice-runner.pages.dev",  # Production frontend
        "https://*.voice-runner.pages.dev",  # Preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local")  # "local" or "r2"
LOCAL_STORAGE_PATH = Path(os.getenv("LOCAL_STORAGE_PATH", "./data"))
R2_BUCKET = os.getenv("R2_BUCKET", "voice-runner-recordings")
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY", "")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY", "")

# Initialize storage
LOCAL_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
(LOCAL_STORAGE_PATH / "audio").mkdir(exist_ok=True)
(LOCAL_STORAGE_PATH / "sessions").mkdir(exist_ok=True)

# Initialize R2 client if configured
s3_client = None
if STORAGE_TYPE == "r2" and R2_ENDPOINT:
    s3_client = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


# Models
class SessionData(BaseModel):
    id: str
    playerId: str
    deviceType: Optional[str] = None
    browser: Optional[str] = None
    demographicAgeRange: Optional[str] = None
    demographicParish: Optional[str] = None
    demographicPatoisFirst: Optional[str] = None
    calibrationPhrases: List[str] = []
    totalPhrasesAttempted: int = 0
    totalPhrasesSucceeded: int = 0
    finalScore: int = 0
    maxLevelReached: int = 1
    bestCombo: int = 1
    sessionDurationSeconds: int = 0
    timestampStart: str
    timestampEnd: Optional[str] = None


class RecordingMetadata(BaseModel):
    sessionId: str
    phraseId: str
    phraseText: str
    phraseTier: int
    phraseCategory: str
    phraseRegister: str
    gameLevel: int
    gameSpeed: float
    obstacleDistanceAtSpeechStart: float
    timeToSpeechOnsetMs: int
    speechDurationMs: int
    outcome: str
    scoreAwarded: int
    comboMultiplier: float
    audioPeakAmplitude: Optional[float] = None
    audioClippingDetected: bool = False
    timestampUtc: str


class UploadResponse(BaseModel):
    success: bool
    sessionId: str
    recordingsReceived: int
    message: str


class StatsResponse(BaseModel):
    totalSessions: int
    totalRecordings: int
    totalPlayersUnique: int
    phraseBreakdown: dict
    registerBreakdown: dict


# Helper functions
def save_audio_local(session_id: str, phrase_id: str, audio_data: bytes, filename: str) -> str:
    """Save audio file to local storage"""
    audio_dir = LOCAL_STORAGE_PATH / "audio" / session_id
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = audio_dir / filename
    with open(file_path, "wb") as f:
        f.write(audio_data)
    
    return str(file_path)


def save_audio_r2(session_id: str, phrase_id: str, audio_data: bytes, filename: str) -> str:
    """Save audio file to Cloudflare R2"""
    key = f"audio/{session_id}/{filename}"
    
    s3_client.put_object(
        Bucket=R2_BUCKET,
        Key=key,
        Body=audio_data,
        ContentType="audio/webm"
    )
    
    return f"r2://{R2_BUCKET}/{key}"


def save_session_local(session: SessionData) -> str:
    """Save session data to local storage"""
    session_dir = LOCAL_STORAGE_PATH / "sessions"
    file_path = session_dir / f"{session.id}.json"
    
    with open(file_path, "w") as f:
        json.dump(session.dict(), f, indent=2)
    
    return str(file_path)


def save_recording_metadata_local(metadata: RecordingMetadata, audio_path: str) -> str:
    """Save recording metadata to local storage"""
    metadata_dir = LOCAL_STORAGE_PATH / "metadata" / metadata.sessionId
    metadata_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = metadata_dir / f"{metadata.phraseId}_{metadata.timestampUtc.replace(':', '-')}.json"
    
    data = metadata.dict()
    data["audioPath"] = audio_path
    
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)
    
    return str(file_path)


async def process_upload_background(
    session_data: dict,
    recordings: List[tuple]  # List of (metadata, audio_bytes)
):
    """Background task to process uploads"""
    try:
        # Save session
        session = SessionData(**session_data)
        save_session_local(session)
        
        # Save recordings
        for metadata_dict, audio_bytes, filename in recordings:
            metadata = RecordingMetadata(**metadata_dict)
            
            # Save audio
            if STORAGE_TYPE == "r2" and s3_client:
                audio_path = save_audio_r2(session.id, metadata.phraseId, audio_bytes, filename)
            else:
                audio_path = save_audio_local(session.id, metadata.phraseId, audio_bytes, filename)
            
            # Save metadata
            save_recording_metadata_local(metadata, audio_path)
        
        print(f"Processed session {session.id} with {len(recordings)} recordings")
        
    except Exception as e:
        print(f"Error processing upload: {e}")


# Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "Voice Runner API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "storage": STORAGE_TYPE,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/upload", response_model=UploadResponse)
async def upload_session(
    background_tasks: BackgroundTasks,
    session: str = Form(...),
):
    """
    Upload a complete game session with recordings.
    
    This endpoint receives:
    - session: JSON string with session metadata
    - audio_N: Audio files (N = 0, 1, 2, ...)
    - audio_N_meta: JSON metadata for each audio file
    """
    try:
        session_data = json.loads(session)
        session_id = session_data.get("id", str(uuid.uuid4()))
        
        # For now, just save the session data
        # Audio files would be handled separately in a real implementation
        session_obj = SessionData(**session_data)
        save_session_local(session_obj)
        
        return UploadResponse(
            success=True,
            sessionId=session_id,
            recordingsReceived=0,  # Will be updated when audio handling is added
            message="Session uploaded successfully"
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@app.post("/api/upload/audio")
async def upload_audio(
    session_id: str = Form(...),
    phrase_id: str = Form(...),
    metadata: str = Form(...),
    audio: UploadFile = File(...),
):
    """Upload a single audio recording"""
    try:
        metadata_dict = json.loads(metadata)
        audio_bytes = await audio.read()
        
        # Validate audio size (max 5MB)
        if len(audio_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio file too large (max 5MB)")
        
        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{phrase_id}_{timestamp}.webm"
        
        # Save audio
        if STORAGE_TYPE == "r2" and s3_client:
            audio_path = save_audio_r2(session_id, phrase_id, audio_bytes, filename)
        else:
            audio_path = save_audio_local(session_id, phrase_id, audio_bytes, filename)
        
        # Save metadata
        metadata_obj = RecordingMetadata(**metadata_dict)
        save_recording_metadata_local(metadata_obj, audio_path)
        
        return {
            "success": True,
            "audioPath": audio_path,
            "sizeBytes": len(audio_bytes)
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid metadata JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Get aggregate statistics about collected data"""
    try:
        sessions_dir = LOCAL_STORAGE_PATH / "sessions"
        metadata_dir = LOCAL_STORAGE_PATH / "metadata"
        
        # Count sessions
        session_files = list(sessions_dir.glob("*.json")) if sessions_dir.exists() else []
        total_sessions = len(session_files)
        
        # Count unique players and gather stats
        unique_players = set()
        phrase_breakdown = {}
        register_breakdown = {}
        total_recordings = 0
        
        for session_file in session_files:
            with open(session_file) as f:
                session = json.load(f)
                unique_players.add(session.get("playerId", "unknown"))
        
        # Count recordings and gather phrase/register stats
        if metadata_dir.exists():
            for session_dir in metadata_dir.iterdir():
                if session_dir.is_dir():
                    for meta_file in session_dir.glob("*.json"):
                        total_recordings += 1
                        with open(meta_file) as f:
                            meta = json.load(f)
                            category = meta.get("phraseCategory", "unknown")
                            register = meta.get("phraseRegister", "unknown")
                            
                            phrase_breakdown[category] = phrase_breakdown.get(category, 0) + 1
                            register_breakdown[register] = register_breakdown.get(register, 0) + 1
        
        return StatsResponse(
            totalSessions=total_sessions,
            totalRecordings=total_recordings,
            totalPlayersUnique=len(unique_players),
            phraseBreakdown=phrase_breakdown,
            registerBreakdown=register_breakdown
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {e}")


@app.get("/api/export")
async def export_data(format: str = "json"):
    """Export collected data for analysis"""
    try:
        sessions_dir = LOCAL_STORAGE_PATH / "sessions"
        metadata_dir = LOCAL_STORAGE_PATH / "metadata"
        
        export_data = {
            "exportedAt": datetime.utcnow().isoformat(),
            "sessions": [],
            "recordings": []
        }
        
        # Export sessions
        if sessions_dir.exists():
            for session_file in sessions_dir.glob("*.json"):
                with open(session_file) as f:
                    export_data["sessions"].append(json.load(f))
        
        # Export recording metadata
        if metadata_dir.exists():
            for session_dir in metadata_dir.iterdir():
                if session_dir.is_dir():
                    for meta_file in session_dir.glob("*.json"):
                        with open(meta_file) as f:
                            export_data["recordings"].append(json.load(f))
        
        return JSONResponse(content=export_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
