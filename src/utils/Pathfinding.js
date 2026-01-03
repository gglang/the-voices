import { MAP } from '../config/constants.js';

/**
 * MinHeap for efficient priority queue operations - O(log n) insert/extract
 */
class MinHeap {
  constructor() {
    this.heap = [];
    this.indices = new Map(); // key -> index in heap for O(1) lookup
  }

  get size() {
    return this.heap.length;
  }

  push(key, priority, data) {
    const node = { key, priority, data };
    this.heap.push(node);
    this.indices.set(key, this.heap.length - 1);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    this.indices.delete(min.key);
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indices.set(last.key, 0);
      this._bubbleDown(0);
    }
    return min;
  }

  has(key) {
    return this.indices.has(key);
  }

  decreaseKey(key, newPriority, newData) {
    const idx = this.indices.get(key);
    if (idx === undefined) return false;
    if (newPriority < this.heap[idx].priority) {
      this.heap[idx].priority = newPriority;
      this.heap[idx].data = newData;
      this._bubbleUp(idx);
      return true;
    }
    return false;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      this._swap(idx, parent);
      idx = parent;
    }
  }

  _bubbleDown(idx) {
    const len = this.heap.length;
    while (true) {
      const left = (idx << 1) + 1;
      const right = left + 1;
      let smallest = idx;
      if (left < len && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < len && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === idx) break;
      this._swap(idx, smallest);
      idx = smallest;
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
    this.indices.set(this.heap[i].key, i);
    this.indices.set(this.heap[j].key, j);
  }
}

/**
 * Optimized A* pathfinding utility for navigating the town grid
 */
export class Pathfinding {
  // Use bit-packing for tile keys: y * 65536 + x (supports maps up to 65535x65535)
  static tileKey(x, y) {
    return (y << 16) | x;
  }

  static keyToCoords(key) {
    return { x: key & 0xFFFF, y: key >> 16 };
  }

  /**
   * Find a path from start to goal using optimized A*
   */
  static findPath(startX, startY, goalX, goalY, townData, preferRoads = true) {
    if (!townData || !townData.grid) return [];

    const tileSize = townData.tileSize || MAP.TILE_SIZE;
    const grid = townData.grid;
    const mapWidth = townData.mapWidth;
    const mapHeight = townData.mapHeight;

    // Convert to tile coordinates
    const startTileX = Math.floor(startX / tileSize);
    const startTileY = Math.floor(startY / tileSize);
    const goalTileX = Math.floor(goalX / tileSize);
    const goalTileY = Math.floor(goalY / tileSize);

    // Early exit: same tile
    if (startTileX === goalTileX && startTileY === goalTileY) {
      return [{ x: goalX, y: goalY }];
    }

    // Early exit: adjacent tile, just return goal
    const tileDist = Math.abs(goalTileX - startTileX) + Math.abs(goalTileY - startTileY);
    if (tileDist <= 2) {
      if (this.isInBounds(goalTileX, goalTileY, mapWidth, mapHeight) &&
          this.isWalkable(grid, goalTileX, goalTileY)) {
        return [{ x: goalX, y: goalY }];
      }
    }

    // Bounds check
    if (!this.isInBounds(startTileX, startTileY, mapWidth, mapHeight) ||
        !this.isInBounds(goalTileX, goalTileY, mapWidth, mapHeight)) {
      return [];
    }

    // Check if start is blocked
    if (!this.isWalkable(grid, startTileX, startTileY)) {
      return [];
    }

    // If goal is blocked, find nearest walkable tile
    let actualGoalX = goalTileX;
    let actualGoalY = goalTileY;
    if (!this.isWalkable(grid, goalTileX, goalTileY)) {
      const nearest = this.findNearestWalkable(grid, goalTileX, goalTileY, mapWidth, mapHeight);
      if (nearest) {
        actualGoalX = nearest.x;
        actualGoalY = nearest.y;
      } else {
        return [];
      }
    }

    // Optimized A* with binary heap
    const openSet = new MinHeap();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();

    const startKey = this.tileKey(startTileX, startTileY);
    const goalKey = this.tileKey(actualGoalX, actualGoalY);

    gScore.set(startKey, 0);
    const startH = this.heuristic(startTileX, startTileY, actualGoalX, actualGoalY);
    openSet.push(startKey, startH, { x: startTileX, y: startTileY });

    // Pre-compute neighbor offsets with costs
    const neighbors = [
      { dx: 0, dy: -1, cost: 1 },
      { dx: 0, dy: 1, cost: 1 },
      { dx: -1, dy: 0, cost: 1 },
      { dx: 1, dy: 0, cost: 1 },
      { dx: -1, dy: -1, cost: 1.414 },
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: 1, dy: 1, cost: 1.414 }
    ];

    let iterations = 0;
    const maxIterations = 500; // Reduced from 1000

    while (openSet.size > 0 && iterations < maxIterations) {
      iterations++;

      // Extract node with lowest fScore - O(log n) with heap
      const current = openSet.pop();
      if (!current) break;

      const currentKey = current.key;
      const currentNode = current.data;

      // Check if we reached the goal
      if (currentKey === goalKey) {
        return this.reconstructPath(cameFrom, currentNode, tileSize);
      }

      closedSet.add(currentKey);

      const currentG = gScore.get(currentKey);

      // Check all neighbors
      for (const { dx, dy, cost } of neighbors) {
        const nx = currentNode.x + dx;
        const ny = currentNode.y + dy;
        const neighborKey = this.tileKey(nx, ny);

        if (closedSet.has(neighborKey)) continue;
        if (!this.isInBounds(nx, ny, mapWidth, mapHeight)) continue;
        if (!this.isWalkable(grid, nx, ny)) continue;

        // Diagonal corner check
        if (dx !== 0 && dy !== 0) {
          if (!this.isWalkable(grid, currentNode.x + dx, currentNode.y) ||
              !this.isWalkable(grid, currentNode.x, currentNode.y + dy)) {
            continue;
          }
        }

        // Calculate move cost
        const tileCost = preferRoads ? this.getMoveCost(grid, nx, ny) : 1;
        const tentativeG = currentG + cost * tileCost;

        const existingG = gScore.get(neighborKey);
        if (existingG !== undefined && tentativeG >= existingG) continue;

        gScore.set(neighborKey, tentativeG);
        cameFrom.set(neighborKey, currentNode);

        const h = this.heuristic(nx, ny, actualGoalX, actualGoalY);
        const f = tentativeG + h;
        const neighborData = { x: nx, y: ny };

        if (openSet.has(neighborKey)) {
          openSet.decreaseKey(neighborKey, f, neighborData);
        } else {
          openSet.push(neighborKey, f, neighborData);
        }
      }
    }

    return [];
  }

  /**
   * Simplify path by removing collinear points (no wall iteration)
   */
  static simplifyPath(path, walls) {
    if (path.length <= 2) return path;

    const simplified = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = path[i];
      const next = path[i + 1];

      // Check if points are collinear by comparing direction
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;

      // Not collinear if cross product is non-zero (with small epsilon)
      const cross = dx1 * dy2 - dy1 * dx2;
      if (Math.abs(cross) > 0.01) {
        simplified.push(curr);
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  /**
   * Check if there's a direct path between two points
   * Optimized to use grid checks instead of iterating wall sprites
   */
  static hasDirectPath(from, to, walls, townData) {
    if (!townData?.grid) return true;

    const tileSize = townData.tileSize || MAP.TILE_SIZE;
    const grid = townData.grid;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / tileSize);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = Math.floor((from.x + dx * t) / tileSize);
      const checkY = Math.floor((from.y + dy * t) / tileSize);

      if (!this.isWalkable(grid, checkX, checkY)) {
        return false;
      }
    }

    return true;
  }

  static heuristic(x1, y1, x2, y2) {
    // Octile distance - optimal for 8-directional movement
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return dx + dy - 0.586 * Math.min(dx, dy); // 0.586 = 2 - sqrt(2)
  }

  static isInBounds(x, y, width, height) {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  static isWalkable(grid, x, y) {
    const col = grid[x];
    if (!col) return false;
    const cell = col[y];
    if (!cell) return false;
    const type = cell.type;
    return type !== 'wall' && type !== 'tree' && type !== 'fountain';
  }

  static getMoveCost(grid, x, y) {
    const col = grid[x];
    if (!col) return 10;
    const cell = col[y];
    if (!cell) return 10;
    const type = cell.type;
    // Penalize grass to prefer roads
    return (type === 'empty' || type === 'grass') ? 8 : 1;
  }

  static findNearestWalkable(grid, x, y, mapWidth, mapHeight) {
    for (let radius = 1; radius < 8; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (this.isInBounds(nx, ny, mapWidth, mapHeight) && this.isWalkable(grid, nx, ny)) {
            return { x: nx, y: ny };
          }
        }
      }
    }
    return null;
  }

  static reconstructPath(cameFrom, current, tileSize) {
    const path = [];
    let node = current;
    const halfTile = tileSize / 2;

    while (node) {
      path.push({
        x: node.x * tileSize + halfTile,
        y: node.y * tileSize + halfTile
      });
      const key = this.tileKey(node.x, node.y);
      node = cameFrom.get(key);
    }

    path.reverse();
    return path;
  }
}
