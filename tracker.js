import * as fs from 'fs';
import fetch from 'node-fetch';
import { Subject, ReplaySubject } from 'rxjs';

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
  
 const issPosition$ = new Subject();
 
setInterval(() => {
   fetch('http://api.open-notify.org/iss-now.json')
       .then(resp => resp.json())
       .then(resp => issPosition$.next(resp))
       .catch(error => {
           console.error(error);
       });
}, 1000);
 
issPosition$.subscribe(console.log);
