import * as fs from 'fs';
import { ReplaySubject } from 'rxjs';
 
const inputFilePath = './stargazers.json';
const stargazers$ = new ReplaySubject(1);

function readFile() {
    try {
        const data = JSON.parse(fs.readFileSync(inputFilePath));
        stargazers$.next(data);
    } catch(e) {
        console.error(e);
    }
 }
 
 fs.watchFile(inputFilePath, readFile);
 readFile();
  
 stargazers$.subscribe(console.log);