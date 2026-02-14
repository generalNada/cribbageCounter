// Cribbage Hand Counter
// Standard 52-card deck scoring

// Card data structure: { rank: 'A'|'2'|...|'K', suit: '♠'|'♥'|'♦'|'♣' }
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

// Initialize deck
const DECK = [];
RANKS.forEach(rank => {
    SUITS.forEach(suit => {
        DECK.push({ rank, suit });
    });
});

// Get card value for fifteens (A=1, 2-10 face value, J/Q/K=10)
function getCardValue(card) {
    if (card.rank === 'A') return 1;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    return parseInt(card.rank);
}

// Parse card string "A♠" to { rank: 'A', suit: '♠' }
function parseCard(cardString) {
    if (!cardString) return null;
    const suit = cardString.slice(-1);
    const rank = cardString.slice(0, -1);
    if (RANKS.includes(rank) && SUITS.includes(suit)) {
        return { rank, suit };
    }
    return null;
}

// Format card object to string
function formatCard(card) {
    if (!card) return '';
    return `${card.rank}${card.suit}`;
}

// Score fifteens: all combinations that sum to 15
function scoreFifteens(cards) {
    const n = cards.length;
    let totalPoints = 0;
    const combinations = [];

    // Generate all non-empty subsets
    for (let mask = 1; mask < (1 << n); mask++) {
        const combo = [];
        let sum = 0;
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                combo.push(cards[i]);
                sum += getCardValue(cards[i]);
            }
        }
        if (sum === 15) {
            totalPoints += 2;
            combinations.push(combo.map(formatCard));
        }
    }

    return { points: totalPoints, combinations };
}

// Score pairs: 2 for pair, 6 for three-of-a-kind, 12 for four-of-a-kind
function scorePairs(cards) {
    const rankCounts = {};
    cards.forEach(card => {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });

    let totalPoints = 0;
    const pairs = [];

    Object.entries(rankCounts).forEach(([rank, count]) => {
        if (count >= 2) {
            let points = 0;
            if (count === 2) {
                points = 2;
                pairs.push(`Pair of ${rank}s`);
            } else if (count === 3) {
                points = 6; // 3 choose 2 = 3 pairs, each worth 2
                pairs.push(`Three ${rank}s`);
            } else if (count === 4) {
                points = 12; // 4 choose 2 = 6 pairs, each worth 2
                pairs.push(`Four ${rank}s`);
            }
            totalPoints += points;
        }
    });

    return { points: totalPoints, pairs };
}

// Get numeric rank for run detection (A=1, 2-10 face value, J=11, Q=12, K=13)
function getNumericRank(card) {
    if (card.rank === 'A') return 1;
    if (card.rank === 'J') return 11;
    if (card.rank === 'Q') return 12;
    if (card.rank === 'K') return 13;
    return parseInt(card.rank);
}

// Score runs: detect runs of 3, 4, or 5 cards
// In cribbage, you score the longest run, with multiplier based on duplicates
function scoreRuns(cards) {
    if (cards.length < 3) return { points: 0, runs: [] };

    // Group by rank to handle duplicates
    const rankGroups = {};
    cards.forEach(card => {
        const rank = getNumericRank(card);
        if (!rankGroups[rank]) {
            rankGroups[rank] = [];
        }
        rankGroups[rank].push(card);
    });

    const ranks = Object.keys(rankGroups).map(Number).sort((a, b) => a - b);
    
    // Find the longest run (cribbage rules: score only the longest run)
    let bestRun = null;
    let bestLength = 0;

    // Check for runs of 5
    if (ranks.length >= 5) {
        for (let i = 0; i <= ranks.length - 5; i++) {
            if (ranks[i + 4] === ranks[i] + 4) {
                let multiplier = 1;
                const runRanks = [];
                for (let j = 0; j < 5; j++) {
                    const rank = ranks[i + j];
                    runRanks.push(rank);
                    multiplier *= rankGroups[rank].length;
                }
                if (5 > bestLength) {
                    bestLength = 5;
                    bestRun = { length: 5, multiplier, ranks: runRanks };
                }
            }
        }
    }

    // Check for runs of 4 (only if no run of 5 found)
    if (bestLength < 4 && ranks.length >= 4) {
        for (let i = 0; i <= ranks.length - 4; i++) {
            if (ranks[i + 3] === ranks[i] + 3) {
                let multiplier = 1;
                const runRanks = [];
                for (let j = 0; j < 4; j++) {
                    const rank = ranks[i + j];
                    runRanks.push(rank);
                    multiplier *= rankGroups[rank].length;
                }
                if (4 > bestLength) {
                    bestLength = 4;
                    bestRun = { length: 4, multiplier, ranks: runRanks };
                }
            }
        }
    }

    // Check for runs of 3 (only if no run of 4 or 5 found)
    if (bestLength < 3 && ranks.length >= 3) {
        for (let i = 0; i <= ranks.length - 3; i++) {
            if (ranks[i + 2] === ranks[i] + 2) {
                let multiplier = 1;
                const runRanks = [];
                for (let j = 0; j < 3; j++) {
                    const rank = ranks[i + j];
                    runRanks.push(rank);
                    multiplier *= rankGroups[rank].length;
                }
                if (3 > bestLength) {
                    bestLength = 3;
                    bestRun = { length: 3, multiplier, ranks: runRanks };
                }
            }
        }
    }

    if (!bestRun) {
        return { points: 0, runs: [] };
    }

    // Build the cards list for display
    const runCards = [];
    bestRun.ranks.forEach(rank => {
        runCards.push(...rankGroups[rank]);
    });

    const totalPoints = bestRun.length * bestRun.multiplier;
    const runs = [{
        length: bestRun.length,
        multiplier: bestRun.multiplier,
        cards: runCards.map(formatCard)
    }];

    return { points: totalPoints, runs };
}

// Score flush: hand flush = 4, with cut matching = 5, crib flush requires all 5
function scoreFlush(cards, isCrib) {
    if (cards.length < 4) return { points: 0 };

    const handCards = cards.slice(0, 4);
    const cutCard = cards[4];

    // Check if all hand cards have same suit
    const firstSuit = handCards[0].suit;
    const isHandFlush = handCards.every(card => card.suit === firstSuit);

    if (!isHandFlush) return { points: 0 };

    // If crib, all 5 cards must match
    if (isCrib) {
        if (cutCard && cutCard.suit === firstSuit) {
            return { points: 5 };
        }
        return { points: 0 };
    }

    // If hand, check if cut matches
    if (cutCard && cutCard.suit === firstSuit) {
        return { points: 5 };
    }

    return { points: 4 };
}

// Score nobs: jack in hand matching cut suit = 1 point
function scoreNobs(cards) {
    if (cards.length < 5) return { points: 0 };
    
    const handCards = cards.slice(0, 4);
    const cutCard = cards[4];

    if (!cutCard) return { points: 0 };

    const jackInHand = handCards.find(card => card.rank === 'J');
    if (jackInHand && jackInHand.suit === cutCard.suit) {
        return { points: 1, card: formatCard(jackInHand) };
    }

    return { points: 0 };
}

// Main scoring function
function scoreHand(cards, isCrib = false) {
    if (!cards || cards.length !== 5 || cards.some(c => !c)) {
        return null;
    }

    const fifteens = scoreFifteens(cards);
    const pairs = scorePairs(cards);
    const runs = scoreRuns(cards);
    const flush = scoreFlush(cards, isCrib);
    const nobs = scoreNobs(cards);

    const total = fifteens.points + pairs.points + runs.points + flush.points + nobs.points;

    return {
        total,
        fifteens,
        pairs,
        runs,
        flush,
        nobs
    };
}

// UI Functions
let selectedCards = [null, null, null, null, null]; // 4 hand + 1 cut
let currentSlotIndex = 0; // Track which slot to fill next

function initializeDeck() {
    const deckGrid = document.getElementById('deckGrid');
    deckGrid.innerHTML = '';
    
    // Organize cards by suit
    const cardsBySuit = {
        '♠': [],
        '♥': [],
        '♦': [],
        '♣': []
    };
    
    DECK.forEach(card => {
        cardsBySuit[card.suit].push(card);
    });
    
    // Create suit headers first (for mobile layout)
    SUITS.forEach(suit => {
        const suitHeader = document.createElement('div');
        suitHeader.className = 'suit-header';
        suitHeader.textContent = suit;
        if (suit === '♥' || suit === '♦') {
            suitHeader.classList.add('red');
        } else {
            suitHeader.classList.add('black');
        }
        deckGrid.appendChild(suitHeader);
    });
    
    // Add cards row by row (one card from each suit per row)
    RANKS.forEach(rank => {
        SUITS.forEach(suit => {
            const card = cardsBySuit[suit].find(c => c.rank === rank);
            if (card) {
                const cardEl = document.createElement('div');
                cardEl.className = 'deck-card';
                cardEl.dataset.card = formatCard(card);
                
                // Add color class for red suits
                if (card.suit === '♥' || card.suit === '♦') {
                    cardEl.classList.add('red');
                } else {
                    cardEl.classList.add('black');
                }
                
                const rankEl = document.createElement('div');
                rankEl.className = 'card-rank';
                rankEl.textContent = card.rank;
                
                const suitEl = document.createElement('div');
                suitEl.className = 'card-suit';
                suitEl.textContent = card.suit;
                
                cardEl.appendChild(rankEl);
                cardEl.appendChild(suitEl);
                
                cardEl.addEventListener('click', () => handleCardClick(card));
                
                deckGrid.appendChild(cardEl);
            }
        });
    });
    
    updateAvailableCards();
}

function updateAvailableCards() {
    const usedCards = new Set(selectedCards.filter(c => c).map(formatCard));
    const deckCards = document.querySelectorAll('.deck-card');
    
    deckCards.forEach(cardEl => {
        const cardValue = cardEl.dataset.card;
        const isUsed = usedCards.has(cardValue);
        
        if (isUsed) {
            cardEl.classList.add('disabled');
        } else {
            cardEl.classList.remove('disabled');
        }
    });
}

function updateSlots() {
    const slots = document.querySelectorAll('.card-slot');
    
    slots.forEach((slot, index) => {
        const card = selectedCards[index];
        slot.classList.remove('selected');
        slot.innerHTML = '';
        
        if (card) {
            slot.classList.add('selected');
            const cardDisplay = document.createElement('div');
            cardDisplay.className = 'card-display';
            cardDisplay.textContent = formatCard(card);
            
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-card';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeCardFromSlot(index);
            });
            
            slot.appendChild(cardDisplay);
            slot.appendChild(removeBtn);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'slot-placeholder';
            if (index < 4) {
                placeholder.textContent = `Card ${index + 1}`;
            } else {
                placeholder.textContent = 'Cut Card';
            }
            slot.appendChild(placeholder);
        }
    });
}

function handleCardClick(card) {
    const cardValue = formatCard(card);
    const usedCards = new Set(selectedCards.filter(c => c).map(formatCard));
    
    // Check if card is already used
    if (usedCards.has(cardValue)) {
        return;
    }
    
    // Find first empty slot
    let slotIndex = -1;
    for (let i = 0; i < selectedCards.length; i++) {
        if (selectedCards[i] === null) {
            slotIndex = i;
            break;
        }
    }
    
    // If all slots are full, replace the last one
    if (slotIndex === -1) {
        slotIndex = selectedCards.length - 1;
    }
    
    selectedCards[slotIndex] = card;
    updateSlots();
    updateAvailableCards();
    updateDisplay();
}

function removeCardFromSlot(index) {
    selectedCards[index] = null;
    updateSlots();
    updateAvailableCards();
    updateDisplay();
}

function updateDisplay() {
    const handDisplay = document.getElementById('handDisplay');
    const cutDisplay = document.getElementById('cutDisplay');
    
    handDisplay.innerHTML = '';
    cutDisplay.innerHTML = '';

    // Display hand cards
    for (let i = 0; i < 4; i++) {
        if (selectedCards[i]) {
            const cardEl = document.createElement('span');
            cardEl.className = 'card-display';
            cardEl.textContent = formatCard(selectedCards[i]);
            handDisplay.appendChild(cardEl);
        }
    }

    // Display cut card
    if (selectedCards[4]) {
        const cardEl = document.createElement('span');
        cardEl.className = 'card-display';
        cardEl.textContent = formatCard(selectedCards[4]);
        cutDisplay.appendChild(cardEl);
    }

    // Calculate and display score
    updateScore();
}

function updateScore() {
    const isCrib = document.querySelector('input[name="mode"]:checked').value === 'crib';
    const allSelected = selectedCards.every(c => c !== null);
    const container = document.querySelector('.container');
    const body = document.body;

    if (!allSelected) {
        document.getElementById('totalScore').textContent = '0';
        document.getElementById('scoreBreakdown').innerHTML = '<p style="color: #2d2d2d; font-weight: 700; text-align: center; text-shadow: 0 2px 6px rgba(255, 255, 255, 0.8), 0 0 15px rgba(255, 255, 255, 0.5), 0 1px 2px rgba(0, 0, 0, 0.2);">Select all 5 cards to see score</p>';
        // Remove no-blur class and mondor-state when cards aren't all selected
        container.classList.remove('no-blur');
        body.classList.remove('mondor-state');
        return;
    }

    const score = scoreHand(selectedCards, isCrib);
    if (!score) {
        document.getElementById('totalScore').textContent = '0';
        // Remove no-blur class and mondor-state when score is invalid
        container.classList.remove('no-blur');
        body.classList.remove('mondor-state');
        return;
    }

    document.getElementById('totalScore').textContent = score.total;

    // Toggle blur and background image based on score
    if (score.total === 0) {
        container.classList.add('no-blur');
        body.classList.add('mondor-state');
    } else {
        container.classList.remove('no-blur');
        body.classList.remove('mondor-state');
    }

    const breakdown = document.getElementById('scoreBreakdown');
    breakdown.innerHTML = '';

    // Fifteens
    if (score.fifteens.points > 0) {
        const item = createBreakdownItem(
            `Fifteens: ${score.fifteens.points} points`,
            `${score.fifteens.combinations.length} combination(s)`,
            score.fifteens.combinations
        );
        breakdown.appendChild(item);
    }

    // Pairs
    if (score.pairs.points > 0) {
        const item = createBreakdownItem(
            `Pairs: ${score.pairs.points} points`,
            score.pairs.pairs.join(', ')
        );
        breakdown.appendChild(item);
    }

    // Runs
    if (score.runs.points > 0) {
        const runDescriptions = score.runs.runs.map(run => {
            if (run.multiplier > 1) {
                return `Run of ${run.length} (${run.multiplier}x multiplier)`;
            }
            return `Run of ${run.length}`;
        });
        const item = createBreakdownItem(
            `Runs: ${score.runs.points} points`,
            runDescriptions.join(', '),
            score.runs.runs.map(r => r.cards)
        );
        breakdown.appendChild(item);
    }

    // Flush
    if (score.flush.points > 0) {
        const item = createBreakdownItem(
            `Flush: ${score.flush.points} points`,
            isCrib ? 'All 5 cards same suit' : (score.flush.points === 5 ? 'Hand + cut same suit' : 'Hand flush')
        );
        breakdown.appendChild(item);
    }

    // Nobs
    if (score.nobs.points > 0) {
        const item = createBreakdownItem(
            `Nobs: ${score.nobs.points} point`,
            `Jack ${score.nobs.card} matches cut suit`
        );
        breakdown.appendChild(item);
    }

    if (score.total === 0) {
        breakdown.innerHTML = '<div class="mondor-message"><p>You Have Hit A <span class="mondor-word">MONDOR</span> - "19" Points - You Suck</p></div>';
    }
}

function createBreakdownItem(label, details, combinations = null) {
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    
    const labelEl = document.createElement('div');
    labelEl.className = 'item-label';
    labelEl.textContent = label;
    item.appendChild(labelEl);

    const detailsEl = document.createElement('div');
    detailsEl.className = 'item-details';
    detailsEl.textContent = details;
    item.appendChild(detailsEl);

    if (combinations && combinations.length > 0) {
        const combosEl = document.createElement('div');
        combosEl.className = 'item-combos';
        if (Array.isArray(combinations[0])) {
            // Multiple sets of combinations (runs)
            combinations.forEach((comboSet, idx) => {
                combosEl.innerHTML += `<div>Run ${idx + 1}: ${comboSet.join(', ')}</div>`;
            });
        } else {
            // Single set of combinations (fifteens)
            combosEl.textContent = `Combinations: ${combinations.map(c => `[${c.join(', ')}]`).join(', ')}`;
        }
        item.appendChild(combosEl);
    }

    return item;
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 3000);
}

function reset() {
    selectedCards = [null, null, null, null, null];
    const container = document.querySelector('.container');
    const body = document.body;
    container.classList.remove('no-blur');
    body.classList.remove('mondor-state');
    updateSlots();
    updateAvailableCards();
    updateDisplay();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeDeck();
    updateSlots();

    // Slot click to remove card
    document.querySelectorAll('.card-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            // Only handle if clicking the slot itself, not child elements
            if (e.target === slot || e.target.classList.contains('slot-placeholder')) {
                const index = parseInt(slot.dataset.slot);
                if (selectedCards[index]) {
                    removeCardFromSlot(index);
                }
            }
        });
    });

    // Mode toggle
    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateScore();
        });
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', reset);
});

// Test Cases and Self-Test Function
/*
Test Cases:
1. Perfect 29 hand: 5♠ 5♥ 5♦ J♣ (cut: 5♣)
   - Fifteens: 8 (4 combos of 5+5+5)
   - Pairs: 12 (four 5s)
   - Runs: 0
   - Flush: 0
   - Nobs: 1 (J♣ matches cut 5♣)
   - Total: 29

2. Double run: 3♠ 3♥ 4♠ 5♠ (cut: 6♠)
   - Fifteens: 0
   - Pairs: 2 (pair of 3s)
   - Runs: 8 (double run of 4: 3-4-5-6 with two 3s)
   - Flush: 5 (all spades)
   - Nobs: 0
   - Total: 15

3. Triple run: 3♠ 3♥ 3♦ 4♠ 5♠
   - Fifteens: 0
   - Pairs: 6 (three 3s)
   - Runs: 9 (triple run of 3: 3-4-5 with three 3s)
   - Flush: 0
   - Nobs: 0
   - Total: 15
*/

function runTests() {
    console.log('Running Cribbage Scoring Tests...\n');

    // Test 1: Perfect 29 hand
    const test1 = [
        { rank: '5', suit: '♠' },
        { rank: '5', suit: '♥' },
        { rank: '5', suit: '♦' },
        { rank: 'J', suit: '♣' },
        { rank: '5', suit: '♣' }
    ];
    const score1 = scoreHand(test1, false);
    console.log('Test 1 (Perfect 29):', score1);
    console.log('Expected: 29, Got:', score1.total, score1.total === 29 ? '✓' : '✗');

    // Test 2: Double run
    const test2 = [
        { rank: '3', suit: '♠' },
        { rank: '3', suit: '♥' },
        { rank: '4', suit: '♠' },
        { rank: '5', suit: '♠' },
        { rank: '6', suit: '♠' }
    ];
    const score2 = scoreHand(test2, false);
    console.log('\nTest 2 (Double Run):', score2);
    console.log('Expected: 15, Got:', score2.total, score2.total === 15 ? '✓' : '✗');

    // Test 3: Triple run
    const test3 = [
        { rank: '3', suit: '♠' },
        { rank: '3', suit: '♥' },
        { rank: '3', suit: '♦' },
        { rank: '4', suit: '♠' },
        { rank: '5', suit: '♠' }
    ];
    const score3 = scoreHand(test3, false);
    console.log('\nTest 3 (Triple Run):', score3);
    console.log('Expected: 15, Got:', score3.total, score3.total === 15 ? '✓' : '✗');

    // Test 4: Simple fifteens
    const test4 = [
        { rank: '5', suit: '♠' },
        { rank: '5', suit: '♥' },
        { rank: '5', suit: '♦' },
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' }
    ];
    const score4 = scoreHand(test4, false);
    console.log('\nTest 4 (Fifteens):', score4);
    console.log('Fifteens points:', score4.fifteens.points);

    // Test 5: Crib flush (should require all 5)
    const test5 = [
        { rank: 'A', suit: '♠' },
        { rank: '2', suit: '♠' },
        { rank: '3', suit: '♠' },
        { rank: '4', suit: '♠' },
        { rank: '5', suit: '♥' }
    ];
    const score5Hand = scoreHand(test5, false);
    const score5Crib = scoreHand(test5, true);
    console.log('\nTest 5 (Flush):');
    console.log('Hand flush:', score5Hand.flush.points, 'Expected: 4');
    console.log('Crib flush:', score5Crib.flush.points, 'Expected: 0 (cut different suit)');

    console.log('\nTests complete!');
}

// Make test function available globally
window.runTests = runTests;
