export const levelService = {
  calculateLevel(xp: number): number {
    // Formula: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  },

  getXPForLevel(level: number): number {
    // Formula: (level - 1)² × 100
    return Math.pow(level - 1, 2) * 100;
  },

  getXPForNextLevel(currentLevel: number): number {
    return this.getXPForLevel(currentLevel + 1);
  },

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
  },
};



