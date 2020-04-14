import * as fs from 'fs';
import fetch from 'node-fetch';
import { Subject, ReplaySubject, merge} from 'rxjs';
import { map, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { sendSMS } from './rxjs-twilio';

const inputFilePath = './checkpoints.json';

const stargizers$ = new ReplaySubject(1);

function readFile() {
    try {
        const data = JSON.parse(fs.readFileSync(inputFilePath));
        stargizers$.next(data);
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
    let longDiff = Math.abs(parseFloat(point1.longitude) - point2.longitude);
    let latDiff = Math.abs(parseFloat(point1.latitude) - point2.latitude);
    return longDiff < 5 && latDiff < 5;
}

let smsSubscription;

stargizers$
    .pipe(tap(_ => {
        if (smsSubscription) {
            smsSubscription.unsubscribe();
        }
    }))
    .subscribe(stargizers => {
        const observables$ = [];
    
        stargizers.forEach(stargizer => {
            observables$.push(
                issPosition$.pipe(
                    map(issPosition => isNearby(issPosition.iss_position, stargizer.position)),
                    distinctUntilChanged(),
                    filter(val => val),
                    map(_ => stargizer)
                )
            );
        });
        
        smsSubscription = merge(...observables$).subscribe(stargizer => {
            sendSMS(stargizer.phoneNumber, 'Head up! ISS is approaching you!').subscribe(console.log);
        });
    });
