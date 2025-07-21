# Official 2048 Game Rules

**THESE ARE THE CANONICAL 2048 RULES - ALL IMPLEMENTATIONS MUST FOLLOW THESE EXACTLY**

## Core Rules

### 1. Tile Movement
- When swiping in a direction, ALL tiles slide as far as possible in that direction
- Tiles stop when they hit:
  - The edge of the board
  - Another tile with a DIFFERENT value
  - Another tile that has ALREADY MERGED this turn

### 2. Tile Merging
- Two tiles with the SAME value merge into one tile with DOUBLE the value
- Each tile can only merge ONCE per move
- Merging happens from the direction of movement:
  - Swipe LEFT: tiles merge leftward (rightmost tiles move first)
  - Swipe RIGHT: tiles merge rightward (leftmost tiles move first)
  - Swipe UP: tiles merge upward (bottom tiles move first)
  - Swipe DOWN: tiles merge downward (top tiles move first)
- The merged tile cannot merge again in the same move

### 3. Movement Examples

#### Example 1: Simple merge
```
Before:  [2][2][0][0]
Swipe Left
After:   [4][0][0][0]
```

#### Example 2: Multiple merges
```
Before:  [2][2][2][2]
Swipe Left
After:   [4][4][0][0]
(NOT [8][0][0][0] - each tile merges only once!)
```

#### Example 3: Mixed values
```
Before:  [2][4][2][4]
Swipe Left
After:   [2][4][2][4]
(No movement possible - tiles blocked by different values)
```

#### Example 4: Complex merge
```
Before:  [2][2][4][4]
Swipe Left
After:   [4][8][0][0]
```

#### Example 5: Chain blocking
```
Before:  [2][2][2][0]
Swipe Left
After:   [4][2][0][0]
(The third 2 cannot merge with the 4 because 4 already merged)
```

### 4. New Tile Spawning
- After a successful move, ONE new tile spawns
- New tiles are either 2 (90% chance) or 4 (10% chance)
- New tiles spawn in a random EMPTY position
- If no tiles moved, no new tile spawns

### 5. Valid Moves
A move is valid if at least one tile can:
- Slide to an empty space
- Merge with an adjacent tile of the same value

### 6. Game Over
The game is over when:
- No empty spaces remain AND
- No adjacent tiles have the same value (no merges possible)

### 7. Winning
The game is won when any tile reaches 2048 (but can continue playing)

## Implementation Checklist

1. [ ] Tiles slide until blocked
2. [ ] Tiles merge only once per move
3. [ ] Merge priority follows movement direction
4. [ ] Already-merged tiles block further merges
5. [ ] New tile spawns only after valid moves
6. [ ] Game over detection checks all possible moves
7. [ ] Score increases by the value of merged tiles