// @flow

declare module 'perf_hooks' {
  declare type perfHooks$performance = {
    clearMeasures: (label: string) => void,
    clearMarks: (label: string) => void,
    measure: (label: string, mark1: string, mark2: string) => void,
    getEntriesByName: (label: string) => Array<{
      duration: number,
    }>,
    mark: (name: string) => void,
  }

  declare module.exports: {
    performance: perfHooks$performance
  };
}
