import * as fs from 'fs';
import fetch from 'node-fetch';
import { Subject, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, flatMap, map, skip, takeUntil } from 'rxjs/operators';
import { sendSMS } from './rxjs-twilio';

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
 
function isNearby(point1, point2){
    let latDiff = Math.abs(parseFloat(point1.latitude) - point2.latitude);
    let lonDiff = Math.abs(parseFloat(point1.longitude) - point2.longitude);
    return latDiff < 5 && lonDiff < 5;
 }
  
 stargazers$.pipe(
    flatMap(x => x),
    flatMap(stargazer => {
        return issPosition$.pipe(
            map(issPosition => isNearby(issPosition.iss_position, stargazer.position)),
            distinctUntilChanged(),
            filter(isNearby => isNearby),
            flatMap( _ => sendSMS(stargazer.phoneNumber, 'HEADS UP! ISS is approaching you!')),
            takeUntil(stargazers$.pipe(
                skip(1)
            ))
        );
    })
 ).subscribe(console.log);
