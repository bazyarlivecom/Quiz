export class LevelService {
  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  getXPForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  getXPForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return this.getXPForLevel(nextLevel);
  }

  checkLevelUp(oldXP: number, newXP: number): {
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
  } {
    const oldLevel = this.calculateLevel(oldXP);
    const newLevel = this.calculateLevel(newXP);

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
    };
  }
}

