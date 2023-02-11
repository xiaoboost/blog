import { Worker } from 'worker_threads';

const server = new Worker('./worker.js');
