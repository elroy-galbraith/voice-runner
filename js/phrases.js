/**
 * phrases.js - Caribbean Voice Runner Phrase Corpus
 * 
 * Each phrase has:
 * - id: unique identifier
 * - text: the phrase to speak
 * - tier: difficulty 1-5
 * - category: NEU (neutral), EMG (emergency), LOC (location), MED (medical), NUM (numbers)
 * - register: ACR (acrolect/standard), MES (mesolect/mixed), BAS (basilect/deep creole)
 * - phonetic: array of target phonetic features
 * - syllables: approximate syllable count
 */

const Phrases = (function() {
    
    const CORPUS = [
        // ============================================
        // TIER 1 - Simple phrases (2-4 words, ~4-6 syllables)
        // ============================================
        
        // Neutral - Tier 1
        { id: 'NEU-ACR-001', text: 'Open the door', tier: 1, category: 'NEU', register: 'ACR', phonetic: ['TH'], syllables: 4 },
        { id: 'NEU-ACR-002', text: 'Close the window', tier: 1, category: 'NEU', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 4 },
        { id: 'NEU-ACR-003', text: 'The bus is coming', tier: 1, category: 'NEU', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 5 },
        { id: 'NEU-ACR-004', text: 'Turn left here', tier: 1, category: 'NEU', register: 'ACR', phonetic: ['CC'], syllables: 3 },
        { id: 'NEU-ACR-005', text: 'Call me later', tier: 1, category: 'NEU', register: 'ACR', phonetic: ['CC'], syllables: 4 },
        { id: 'NEU-BAS-001', text: 'Mi deh yah', tier: 1, category: 'NEU', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 4 },
        { id: 'NEU-BAS-002', text: 'Wah gwaan', tier: 1, category: 'NEU', register: 'BAS', phonetic: ['VW'], syllables: 2 },
        { id: 'NEU-BAS-003', text: 'Everyting criss', tier: 1, category: 'NEU', register: 'BAS', phonetic: ['TH', 'CC'], syllables: 4 },
        { id: 'NEU-MES-001', text: 'Come over here', tier: 1, category: 'NEU', register: 'MES', phonetic: ['VW', 'HD'], syllables: 4 },
        { id: 'NEU-MES-002', text: 'Pass me the thing', tier: 1, category: 'NEU', register: 'MES', phonetic: ['TH', 'CC'], syllables: 4 },
        
        // Emergency - Tier 1
        { id: 'EMG-ACR-001', text: 'Help me please', tier: 1, category: 'EMG', register: 'ACR', phonetic: ['HD'], syllables: 3 },
        { id: 'EMG-ACR-002', text: 'Someone is hurt', tier: 1, category: 'EMG', register: 'ACR', phonetic: ['HD', 'CC'], syllables: 4 },
        { id: 'EMG-ACR-003', text: "There's a fire", tier: 1, category: 'EMG', register: 'ACR', phonetic: ['TH'], syllables: 4 },
        { id: 'EMG-ACR-004', text: 'Call the police', tier: 1, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 4 },
        { id: 'EMG-ACR-005', text: 'I need help', tier: 1, category: 'EMG', register: 'ACR', phonetic: ['HD'], syllables: 3 },
        { id: 'EMG-BAS-001', text: 'Come yah quick', tier: 1, category: 'EMG', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 3 },
        { id: 'EMG-BAS-002', text: 'Smaddy get hurt', tier: 1, category: 'EMG', register: 'BAS', phonetic: ['HD', 'CC'], syllables: 4 },
        { id: 'EMG-BAS-003', text: 'Fiyah a bun', tier: 1, category: 'EMG', register: 'BAS', phonetic: ['HD', 'VW'], syllables: 4 },
        
        // Location - Tier 1
        { id: 'LOC-ACR-001', text: 'Half Way Tree', tier: 1, category: 'LOC', register: 'ACR', phonetic: ['HD', 'TH'], syllables: 4 },
        { id: 'LOC-ACR-002', text: 'Kingston Jamaica', tier: 1, category: 'LOC', register: 'ACR', phonetic: ['CC'], syllables: 5 },
        { id: 'LOC-ACR-003', text: 'Down the road', tier: 1, category: 'LOC', register: 'ACR', phonetic: ['TH', 'VW'], syllables: 3 },
        
        // Numbers - Tier 1
        { id: 'NUM-ACR-001', text: 'Eight seven six', tier: 1, category: 'NUM', register: 'ACR', phonetic: ['CC'], syllables: 4 },
        { id: 'NUM-ACR-002', text: 'Two people', tier: 1, category: 'NUM', register: 'ACR', phonetic: ['CC'], syllables: 3 },
        { id: 'NUM-ACR-003', text: 'Three children', tier: 1, category: 'NUM', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 3 },
        
        // ============================================
        // TIER 2 - Medium phrases (5-7 words, ~6-9 syllables)
        // ============================================
        
        // Neutral - Tier 2
        { id: 'NEU-ACR-010', text: 'She went to the market', tier: 2, category: 'NEU', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 6 },
        { id: 'NEU-ACR-011', text: 'The children are playing outside', tier: 2, category: 'NEU', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 8 },
        { id: 'NEU-ACR-012', text: 'I will be there soon', tier: 2, category: 'NEU', register: 'ACR', phonetic: ['TH'], syllables: 5 },
        { id: 'NEU-ACR-013', text: 'Please wait for me', tier: 2, category: 'NEU', register: 'ACR', phonetic: ['CC'], syllables: 4 },
        { id: 'NEU-BAS-010', text: 'Dem gone a town already', tier: 2, category: 'NEU', register: 'BAS', phonetic: ['CC', 'VW'], syllables: 6 },
        { id: 'NEU-BAS-011', text: 'Mi soon come back', tier: 2, category: 'NEU', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 4 },
        { id: 'NEU-BAS-012', text: 'Di food ready now', tier: 2, category: 'NEU', register: 'BAS', phonetic: ['VW'], syllables: 5 },
        { id: 'NEU-MES-010', text: 'She cooking dinner right now', tier: 2, category: 'NEU', register: 'MES', phonetic: ['CC'], syllables: 6 },
        
        // Emergency - Tier 2
        { id: 'EMG-ACR-010', text: 'I need an ambulance now', tier: 2, category: 'EMG', register: 'ACR', phonetic: ['CC'], syllables: 7 },
        { id: 'EMG-ACR-011', text: 'The building is flooding', tier: 2, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 6 },
        { id: 'EMG-ACR-012', text: 'Someone broke into my house', tier: 2, category: 'EMG', register: 'ACR', phonetic: ['HD', 'CC'], syllables: 6 },
        { id: 'EMG-ACR-013', text: 'The power lines are down', tier: 2, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 6 },
        { id: 'EMG-BAS-010', text: 'Di pikni sick bad bad', tier: 2, category: 'EMG', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 5 },
        { id: 'EMG-BAS-011', text: 'Wata come een a di house', tier: 2, category: 'EMG', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 6 },
        { id: 'EMG-BAS-012', text: 'Di roof blow off last night', tier: 2, category: 'EMG', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 6 },
        
        // Location - Tier 2
        { id: 'LOC-ACR-010', text: 'Thirty seven King Street', tier: 2, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 6 },
        { id: 'LOC-ACR-011', text: 'Near the main road', tier: 2, category: 'LOC', register: 'ACR', phonetic: ['TH', 'VW'], syllables: 5 },
        { id: 'LOC-ACR-012', text: 'Behind the old church', tier: 2, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 5 },
        { id: 'LOC-BAS-010', text: 'Down by Papine market', tier: 2, category: 'LOC', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 6 },
        { id: 'LOC-MES-010', text: 'Right next to the school', tier: 2, category: 'LOC', register: 'MES', phonetic: ['TH', 'CC'], syllables: 5 },
        
        // Medical - Tier 2
        { id: 'MED-ACR-010', text: "She's bleeding from her head", tier: 2, category: 'MED', register: 'ACR', phonetic: ['HD', 'CC'], syllables: 6 },
        { id: 'MED-ACR-011', text: 'He fell and cannot move', tier: 2, category: 'MED', register: 'ACR', phonetic: ['CC'], syllables: 5 },
        { id: 'MED-BAS-010', text: 'Him head bus bad', tier: 2, category: 'MED', register: 'BAS', phonetic: ['HD', 'CC'], syllables: 4 },
        { id: 'MED-BAS-011', text: 'Di baby have fever', tier: 2, category: 'MED', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 6 },
        
        // Numbers - Tier 2
        { id: 'NUM-ACR-010', text: 'Three people need help', tier: 2, category: 'NUM', register: 'ACR', phonetic: ['TH', 'HD'], syllables: 5 },
        { id: 'NUM-ACR-011', text: 'It happened at six thirty', tier: 2, category: 'NUM', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 7 },
        
        // ============================================
        // TIER 3 - Complex phrases (8-10 words, ~9-12 syllables)
        // ============================================
        
        // Neutral - Tier 3
        { id: 'NEU-ACR-020', text: 'My grandmother lives in Montego Bay', tier: 3, category: 'NEU', register: 'ACR', phonetic: ['TH', 'VW'], syllables: 9 },
        { id: 'NEU-ACR-021', text: 'The meeting starts at three this afternoon', tier: 3, category: 'NEU', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 10 },
        { id: 'NEU-BAS-020', text: 'Di man dem a work pon di building', tier: 3, category: 'NEU', register: 'BAS', phonetic: ['CC', 'HD', 'VW'], syllables: 9 },
        { id: 'NEU-BAS-021', text: 'Mi neva know seh him did leave', tier: 3, category: 'NEU', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 8 },
        
        // Emergency - Tier 3
        { id: 'EMG-ACR-020', text: 'My child is not breathing properly', tier: 3, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 9 },
        { id: 'EMG-ACR-021', text: 'There was a car accident on the main road', tier: 3, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC', 'VW'], syllables: 11 },
        { id: 'EMG-ACR-022', text: 'The tree fell on top of my house', tier: 3, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC', 'HD'], syllables: 9 },
        { id: 'EMG-ACR-023', text: 'We are trapped inside the building', tier: 3, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 9 },
        { id: 'EMG-BAS-020', text: 'Mi nuh know weh fi do him nah breathe', tier: 3, category: 'EMG', register: 'BAS', phonetic: ['VW', 'HD', 'TH'], syllables: 9 },
        { id: 'EMG-BAS-021', text: 'Di whole roof blow off inna di storm', tier: 3, category: 'EMG', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 9 },
        { id: 'EMG-BAS-022', text: 'Smaddy get shot down di road', tier: 3, category: 'EMG', register: 'BAS', phonetic: ['CC', 'VW'], syllables: 7 },
        
        // Location - Tier 3
        { id: 'LOC-ACR-020', text: 'The third house past the big mango tree', tier: 3, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 9 },
        { id: 'LOC-ACR-021', text: 'On Windward Road opposite the gas station', tier: 3, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC', 'VW'], syllables: 12 },
        { id: 'LOC-BAS-020', text: 'Up di road from Miss Ivy shop', tier: 3, category: 'LOC', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 8 },
        { id: 'LOC-BAS-021', text: 'Down by weh di standpipe used to be', tier: 3, category: 'LOC', register: 'BAS', phonetic: ['VW', 'CC'], syllables: 9 },
        
        // Medical - Tier 3
        { id: 'MED-ACR-020', text: "She's having trouble breathing and her chest hurts", tier: 3, category: 'MED', register: 'ACR', phonetic: ['TH', 'CC', 'HD'], syllables: 11 },
        { id: 'MED-ACR-021', text: 'I think his arm might be broken', tier: 3, category: 'MED', register: 'ACR', phonetic: ['TH', 'HD', 'CC'], syllables: 8 },
        { id: 'MED-BAS-020', text: 'Him get chop inna him side wid machete', tier: 3, category: 'MED', register: 'BAS', phonetic: ['HD', 'CC', 'VW'], syllables: 10 },
        { id: 'MED-BAS-021', text: 'Di ooman belly a hurt har bad', tier: 3, category: 'MED', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 9 },
        
        // Numbers - Tier 3
        { id: 'NUM-ACR-020', text: 'The phone number is eight seven six five five five', tier: 3, category: 'NUM', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 13 },
        { id: 'NUM-ACR-021', text: 'There are about ten people trapped inside', tier: 3, category: 'NUM', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 10 },
        
        // ============================================
        // TIER 4 - Long phrases (10-14 words, ~12-16 syllables)
        // ============================================
        
        // Emergency - Tier 4
        { id: 'EMG-ACR-030', text: 'Please send someone quickly the roof is about to collapse', tier: 4, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 14 },
        { id: 'EMG-ACR-031', text: 'There is a car on fire next to the primary school', tier: 4, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC', 'VW'], syllables: 14 },
        { id: 'EMG-ACR-032', text: 'The entire first floor is flooded and the water is rising', tier: 4, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC', 'VW'], syllables: 15 },
        { id: 'EMG-BAS-030', text: 'Lawd God di car lick dung di man right yah so a front', tier: 4, category: 'EMG', register: 'BAS', phonetic: ['VW', 'CC', 'HD'], syllables: 13 },
        { id: 'EMG-BAS-031', text: 'Di gas tank a leak and mi smell fiyah inna di air', tier: 4, category: 'EMG', register: 'BAS', phonetic: ['VW', 'CC', 'HD'], syllables: 13 },
        
        // Location - Tier 4
        { id: 'LOC-ACR-030', text: "I don't know the exact address but it's near the church on Orange Street", tier: 4, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 17 },
        { id: 'LOC-ACR-031', text: "It's on the main road between the gas station and the supermarket", tier: 4, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC', 'VW'], syllables: 17 },
        { id: 'LOC-BAS-030', text: 'Yuh know weh di old post office used to be right deh so', tier: 4, category: 'LOC', register: 'BAS', phonetic: ['VW', 'HD'], syllables: 14 },
        
        // Medical - Tier 4
        { id: 'MED-ACR-030', text: 'She is unconscious and I cannot feel her pulse or heartbeat', tier: 4, category: 'MED', register: 'ACR', phonetic: ['HD', 'CC'], syllables: 15 },
        { id: 'MED-ACR-031', text: 'He grabbed his chest and collapsed I think it might be a heart attack', tier: 4, category: 'MED', register: 'ACR', phonetic: ['HD', 'CC', 'TH'], syllables: 17 },
        { id: 'MED-BAS-030', text: 'Mi nuh know if a heart attack but him grab him chest an drop dung', tier: 4, category: 'MED', register: 'BAS', phonetic: ['HD', 'VW', 'CC'], syllables: 15 },
        
        // Numbers - Tier 4
        { id: 'NUM-ACR-030', text: 'There are about fifteen maybe twenty people trapped in the building', tier: 4, category: 'NUM', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 16 },
        
        // ============================================
        // TIER 5 - Expert phrases (14+ words, ~16+ syllables)
        // ============================================
        
        // Emergency - Tier 5
        { id: 'EMG-ACR-040', text: 'Please you have to help me the building next to the church is on fire and people are inside', tier: 5, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC', 'HD'], syllables: 22 },
        { id: 'EMG-ACR-041', text: 'The hurricane damaged the entire neighborhood and we need water food and medical supplies', tier: 5, category: 'EMG', register: 'ACR', phonetic: ['TH', 'CC'], syllables: 22 },
        { id: 'EMG-BAS-040', text: 'Please uno haffi come now now mi madda fall dung an she cyaan get up har head a bleed', tier: 5, category: 'EMG', register: 'BAS', phonetic: ['VW', 'HD', 'CC'], syllables: 20 },
        { id: 'EMG-BAS-041', text: 'Di whole community need help di storm mash up everyting an nobody nuh have wata fi drink', tier: 5, category: 'EMG', register: 'BAS', phonetic: ['VW', 'HD', 'CC', 'TH'], syllables: 21 },
        
        // Location - Tier 5
        { id: 'LOC-ACR-040', text: 'We are on the corner of Hope Road and Waterloo Road near the big supermarket across from the bank', tier: 5, category: 'LOC', register: 'ACR', phonetic: ['TH', 'CC', 'VW'], syllables: 24 },
        { id: 'LOC-BAS-040', text: 'Yuh haffi turn left by di big church den go straight until yuh see di red gate pon di right side', tier: 5, category: 'LOC', register: 'BAS', phonetic: ['VW', 'HD', 'CC'], syllables: 21 },
        
        // Medical - Tier 5  
        { id: 'MED-ACR-040', text: 'She is eight months pregnant and having severe pain and bleeding please send an ambulance immediately', tier: 5, category: 'MED', register: 'ACR', phonetic: ['TH', 'HD', 'CC'], syllables: 23 },
        { id: 'MED-BAS-040', text: 'Di baby born already but di madda still a bleed an wi cyaan stop it please send help quick', tier: 5, category: 'MED', register: 'BAS', phonetic: ['VW', 'HD', 'CC'], syllables: 20 }
    ];
    
    // Calibration phrases (always tier 1, mix of registers)
    const CALIBRATION_PHRASES = [
        { id: 'CAL-001', text: 'Good morning everyone', tier: 1, category: 'NEU', register: 'ACR', syllables: 5 },
        { id: 'CAL-002', text: 'The sun is shining today', tier: 1, category: 'NEU', register: 'ACR', syllables: 6 },
        { id: 'CAL-003', text: 'Mi glad fi see you', tier: 1, category: 'NEU', register: 'BAS', syllables: 5 },
        { id: 'CAL-004', text: 'One two three four five', tier: 1, category: 'NUM', register: 'ACR', syllables: 5 },
        { id: 'CAL-005', text: 'Nice to meet you', tier: 1, category: 'NEU', register: 'ACR', syllables: 4 }
    ];
    
    // Level to tier mapping
    const LEVEL_TIER_MAP = {
        1: [1, 1],
        2: [1, 2],
        3: [1, 2],
        4: [2, 3],
        5: [2, 3],
        6: [3, 4],
        7: [3, 4],
        8: [4, 5],
        9: [4, 5],
        10: [4, 5]
    };
    
    // Track recently used phrases to avoid repetition
    let recentPhrases = [];
    const MAX_RECENT = 10;
    
    // Track category usage for balancing
    let categoryUsage = {
        NEU: 0, EMG: 0, LOC: 0, MED: 0, NUM: 0
    };
    
    /**
     * Get random calibration phrases
     */
    function getCalibrationPhrases(count = 3) {
        const shuffled = [...CALIBRATION_PHRASES].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    /**
     * Select a phrase appropriate for the current level
     */
    function selectPhrase(level) {
        const tierRange = LEVEL_TIER_MAP[Math.min(level, 10)] || [4, 5];
        const [minTier, maxTier] = tierRange;
        
        // Filter eligible phrases
        let eligible = CORPUS.filter(p => 
            p.tier >= minTier && 
            p.tier <= maxTier &&
            !recentPhrases.includes(p.id)
        );
        
        if (eligible.length === 0) {
            // If no eligible phrases (unlikely), reset recent and try again
            recentPhrases = [];
            eligible = CORPUS.filter(p => p.tier >= minTier && p.tier <= maxTier);
        }
        
        // Weight by underused categories
        const totalUsage = Object.values(categoryUsage).reduce((a, b) => a + b, 1);
        const categoryWeights = {};
        
        for (const cat of Object.keys(categoryUsage)) {
            // Inverse weight - less used categories get higher weight
            categoryWeights[cat] = 1 - (categoryUsage[cat] / totalUsage) + 0.2;
        }
        
        // Give emergency phrases slight boost (they're the focus)
        categoryWeights['EMG'] *= 1.3;
        
        // Calculate weighted selection
        const weighted = eligible.map(p => ({
            phrase: p,
            weight: categoryWeights[p.category] || 1
        }));
        
        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;
        
        let selected = weighted[0].phrase;
        for (const w of weighted) {
            random -= w.weight;
            if (random <= 0) {
                selected = w.phrase;
                break;
            }
        }
        
        // Update tracking
        recentPhrases.push(selected.id);
        if (recentPhrases.length > MAX_RECENT) {
            recentPhrases.shift();
        }
        categoryUsage[selected.category]++;
        
        return selected;
    }
    
    /**
     * Estimate speaking duration for a phrase (in ms)
     */
    function estimateDuration(phrase) {
        // Average speaking rate: ~4 syllables per second (150 words/min)
        // Under pressure, might be faster: ~5 syllables per second
        const syllables = phrase.syllables || phrase.text.split(/\s+/).length * 1.5;
        return (syllables / 4) * 1000;
    }
    
    /**
     * Get corpus stats
     */
    function getStats() {
        const stats = {
            total: CORPUS.length,
            byTier: {},
            byCategory: {},
            byRegister: {}
        };
        
        for (const p of CORPUS) {
            stats.byTier[p.tier] = (stats.byTier[p.tier] || 0) + 1;
            stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
            stats.byRegister[p.register] = (stats.byRegister[p.register] || 0) + 1;
        }
        
        return stats;
    }
    
    /**
     * Reset tracking (for new game)
     */
    function reset() {
        recentPhrases = [];
        categoryUsage = { NEU: 0, EMG: 0, LOC: 0, MED: 0, NUM: 0 };
    }
    
    /**
     * Get a phrase by ID
     */
    function getById(id) {
        return CORPUS.find(p => p.id === id) || CALIBRATION_PHRASES.find(p => p.id === id);
    }
    
    // Public API
    return {
        getCalibrationPhrases,
        selectPhrase,
        estimateDuration,
        getStats,
        reset,
        getById,
        LEVEL_TIER_MAP
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Phrases;
}
