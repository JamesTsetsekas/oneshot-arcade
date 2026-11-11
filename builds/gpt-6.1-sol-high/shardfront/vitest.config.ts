import {defineConfig} from 'vitest/config';
export default defineConfig({test:{testTimeout:60000,maxWorkers:1,fileParallelism:false}});
