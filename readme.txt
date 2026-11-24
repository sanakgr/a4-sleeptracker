A4 - SleepWise: Personal Sleep Tracker

Author: Sana Kimiagar
Email: skimiaga@uci.edu
UCI ID: 73266558
Assignment Group: 58
Participation: Solo

1. Estimated assignment points

10/10

- 1/1 Overnight sleep logging
- 1/1 Daytime sleepiness logging
- 1/1 Viewing both categories of logged data
- 2/2 Persistent data storage
- 2/2 Good principles of mobile design
- 2/2 Creating a compelling app
- 1/1 README and demo video, upon completion

2. Time spent on the assignment

8 hours

3. Online resources consulted

https://github.com/travislindenreid/a4-sleeptracker
https://ionicframework.com/docs/
https://nodejs.org/en/
https://github.com/nvm-sh/nvm
https://capacitorjs.com/docs/apis/preferences
https://capacitorjs.com/docs/apis/local-notifications
https://developer.chrome.com/docs/devtools/device-mode

I used the course instructions, starter code, and
ChatGPT for implementation assistance, debugging,
interface design, and documentation.

4. Classmates or other individuals consulted

I completed this assignment individually.

5. Instructions to run the application

Navigate into the sleeptracker directory and run:

npm install
ionic serve

Node.js 22 is recommended.
The application can be tested in Chrome mobile mode.
The production build can be generated with npm run build.

6. Target audience

SleepWise is designed primarily for college students
with irregular sleep schedules who want to understand
their sleep habits and daytime alertness.

7. Target platform

The application is responsive, with an emphasis on
iOS mobile design conventions. I tested the application
using an iPhone 13 Pro Max viewport of 428 by 926
pixels in Chrome DevTools.

8. Overnight sleep logging

Users enter their bedtime and wake-up time, preview
their automatically calculated sleep duration, and
save the entry. Input validation prevents invalid
date ranges, future dates, duplicate daily entries,
and sleep durations exceeding 24 hours.

9. Daytime sleepiness logging

Users select one of the seven levels of the Stanford
Sleepiness Scale and specify their check-in time.
The timestamp defaults to the current time to make
logging throughout the day more convenient.

10. Viewing logged data

The History screen displays overnight sleep and
daytime sleepiness records with edit and delete options.
The Insights screen provides weekly visualizations,
sleep averages, goal tracking, and other statistics.

11. Required additional feature

I implemented persistent data storage using
Capacitor Preferences.

12. Native device resource

I implemented sleepiness notification scheduling
using Capacitor Local Notifications. However,
notification delivery could not be verified in
the browser environment, so I am not claiming
the native resource extra-credit point.

13. Data backup

Overnight sleep records, daytime sleepiness records,
and personal sleep goals are saved locally using
Capacitor Preferences and remain available after
refreshing the browser.

14. Principles of good mobile design

The Home dashboard provides a useful initial view
with sleep summaries and quick actions. Bottom
navigation provides convenient access to the four
main screens, input validation prevents mistakes,
and editing and undo functionality allow users
to recover from accidental actions.

Additional features

- Four screens: Home, Log, History, and Insights
- Seven-day sleep duration chart
- Weekly and overall sleep averages
- Average daytime sleepiness
- Longest sleep statistics
- Customizable and persistent sleep goals
- Sleep goal progress indicators
- Automatic sleep duration calculation
- Duplicate record prevention
- Edit and delete functionality
- Undo for the most recently deleted record
- Chronologically sorted records
- Responsive mobile interface
- Customized global Ionic theme
- Consistent dark color palette
- Accessible input labels
- Large mobile-friendly touch targets
- Notification scheduling (delivery not verified)

Technologies used

Ionic, Angular, TypeScript, SCSS, and Capacitor.

The production build completed successfully.
