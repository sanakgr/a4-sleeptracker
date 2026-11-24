import { LocalNotifications } from '@capacitor/local-notifications';

import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';

interface SleepRecord {
  start: string;
  end: string;
  duration: number;
}

interface SleepinessRecord {
  level: number;
  time: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonCard, IonCardContent
  ],
})
export class HomePage {

  reminderMinutes = 1;
  reminderMessage = '';

  async scheduleReminder() {
    try {
      const minutes = Number(this.reminderMinutes);

      if (![1, 15, 30, 60, 120].includes(minutes)) {
        this.reminderMessage = 'Select a valid reminder time.';
        return;
      }

      const permission =
        await LocalNotifications.requestPermissions();

      if (permission.display !== 'granted') {
        this.reminderMessage = 'Please allow notifications.';
        return;
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Date.now() % 2147483647),
          title: 'SleepWise - Daily Check-in',
          body: 'How sleepy do you feel? Log your sleepiness.',
          schedule: {
            at: new Date(Date.now() + minutes * 60000)
          }
        }]
      });

      this.reminderMessage =
        `Reminder scheduled in ${minutes} minute(s)!`;

    } catch {
      this.reminderMessage =
        'Notifications are unavailable. Check permissions.';
    }
  }



  get weeklySleep() {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');

      const record = this.sleepRecords.find(
        item => item.end.slice(0, 10) === dateKey
      );

      return {
        day: date.toLocaleDateString('en-US', {
          weekday: 'short'
        }),
        date: dateKey,
        duration: record?.duration ?? 0,
        logged: !!record
      };
    });
  }

  get weeklyAverage(): number {
    const nights = this.weeklySleep.filter(
      day => day.logged
    );

    if (!nights.length) return 0;

    return Math.round(
      nights.reduce(
        (sum, day) => sum + day.duration, 0
      ) / nights.length
    );
  }

  get weeklyGoalCount(): number {
    return this.weeklySleep.filter(
      day => day.logged &&
        day.duration >= this.sleepGoal * 60
    ).length;
  }

  get longestSleep(): number {
    return Math.max(
      0, ...this.weeklySleep.map(day => day.duration)
    );
  }

  get weeklyChartMax(): number {
    return Math.max(
      720, this.longestSleep, this.sleepGoal * 60
    );
  }

  @ViewChild(IonContent) content?: IonContent;

  activeTab: 'home' | 'log' | 'history' | 'insights' = 'home';
  logType: 'sleep' | 'sleepiness' = 'sleep';

  bedtime = '';
  wakeTime = '';
  sleepinessLevel = 0;
  sleepinessTime = '';

  sleepGoal = 8;
  goalDraft = 8;

  sleepRecords: SleepRecord[] = [];
  sleepinessRecords: SleepinessRecord[] = [];

  editingSleep: SleepRecord | null = null;
  editingSleepiness: SleepinessRecord | null = null;

  deletedRecord:
    | { type: 'sleep'; record: SleepRecord }
    | { type: 'sleepiness'; record: SleepinessRecord }
    | null = null;

  scale = StanfordSleepinessData.ScaleValues.slice(1);

  message = '';
  ready = false;
  saving = false;

  async ngOnInit() {
    this.sleepinessTime = this.localDateTime();

    try {
      const sleep = await Preferences.get({
        key: 'sleepRecords'
      });

      const sleepiness = await Preferences.get({
        key: 'sleepinessRecords'
      });

      const goal = await Preferences.get({
        key: 'sleepGoal'
      });

      this.sleepRecords = JSON.parse(sleep.value || '[]');
      this.sleepinessRecords =
        JSON.parse(sleepiness.value || '[]');

      const savedGoal = Number(goal.value);

      if (savedGoal >= 4 && savedGoal <= 12) {
        this.sleepGoal = savedGoal;
      }

      this.goalDraft = this.sleepGoal;
      this.sortRecords();
      this.ready = true;
    } catch {
      this.message = 'Unable to load saved records.';
    }
  }

  localDateTime(): string {
    const now = new Date();

    return new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);
  }

  sortRecords() {
    this.sleepRecords.sort(
      (a, b) => new Date(b.end).getTime()
        - new Date(a.end).getTime()
    );

    this.sleepinessRecords.sort(
      (a, b) => new Date(b.time).getTime()
        - new Date(a.time).getTime()
    );
  }

  navigate(tab: 'home' | 'log' | 'history' | 'insights') {
    this.activeTab = tab;
    this.message = '';
    this.content?.scrollToTop(0);
  }

  openLog(type: 'sleep' | 'sleepiness') {
    this.cancelEdit();
    this.logType = type;
    this.navigate('log');
  }

  async saveOvernight(records: SleepRecord[]) {
    await Preferences.set({
      key: 'sleepRecords',
      value: JSON.stringify(records)
    });

    this.sleepRecords = records;
    this.sortRecords();
  }

  async saveDaytime(records: SleepinessRecord[]) {
    await Preferences.set({
      key: 'sleepinessRecords',
      value: JSON.stringify(records)
    });

    this.sleepinessRecords = records;
    this.sortRecords();
  }

  async logSleep() {
    if (!this.ready || this.saving) return;

    const start = new Date(this.bedtime).getTime();
    const end = new Date(this.wakeTime).getTime();

    if (!Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start ||
        end > Date.now()) {
      this.message = 'Please enter valid past sleep and wake times.';
      return;
    }

    const durationHours = (end - start) / 3600000;

    if (durationHours > 24) {
      this.message = 'Please check your dates. Sleep cannot exceed 24 hours per entry.';
      return;
    }

    const record: SleepRecord = {
      start: this.bedtime,
      end: this.wakeTime,
      duration: Math.round((end - start) / 60000)
    };

    // Allow only one overnight entry per wake-up day.
    const duplicate = this.sleepRecords.some(
      item => item !== this.editingSleep &&
        item.end.slice(0, 10) === record.end.slice(0, 10)
    );

    if (duplicate) {
      this.message = 'An entry already exists for this day. Edit it in History.';
      return;
    }

    this.saving = true;

    try {
      const wasEditing = this.editingSleep !== null;

      const records = wasEditing
        ? this.sleepRecords.map(item =>
            item === this.editingSleep ? record : item)
        : [record, ...this.sleepRecords];

      await this.saveOvernight(records);

      this.editingSleep = null;
      this.bedtime = '';
      this.wakeTime = '';

      this.message = wasEditing
        ? 'Sleep record updated!'
        : 'Sleep recorded successfully!';
    } catch {
      this.message = 'Unable to save sleep.';
    } finally {
      this.saving = false;
    }
  }

  async logSleepiness() {
    if (!this.ready || this.saving) return;

    const time = new Date(this.sleepinessTime).getTime();

    if (!Number.isInteger(this.sleepinessLevel) ||
        this.sleepinessLevel < 1 ||
        this.sleepinessLevel > 7 ||
        !Number.isFinite(time) ||
        time > Date.now()) {
      this.message = 'Please select a level and valid past time.';
      return;
    }

    const record: SleepinessRecord = {
      level: this.sleepinessLevel,
      time: this.sleepinessTime
    };

    this.saving = true;

    try {
      const wasEditing = this.editingSleepiness !== null;

      const records = wasEditing
        ? this.sleepinessRecords.map(item =>
            item === this.editingSleepiness ? record : item)
        : [record, ...this.sleepinessRecords];

      await this.saveDaytime(records);

      this.editingSleepiness = null;
      this.sleepinessLevel = 0;
      this.sleepinessTime = this.localDateTime();

      this.message = wasEditing
        ? 'Sleepiness record updated!'
        : 'Sleepiness recorded successfully!';
    } catch {
      this.message = 'Unable to save sleepiness.';
    } finally {
      this.saving = false;
    }
  }

  // Load an existing record into the logging form.
  editSleep(record: SleepRecord) {
    if (this.saving) return;

    this.cancelEdit();
    this.editingSleep = record;
    this.bedtime = record.start;
    this.wakeTime = record.end;
    this.logType = 'sleep';
    this.navigate('log');
  }

  editSleepiness(record: SleepinessRecord) {
    if (this.saving) return;

    this.cancelEdit();
    this.editingSleepiness = record;
    this.sleepinessLevel = record.level;
    this.sleepinessTime = record.time;
    this.logType = 'sleepiness';
    this.navigate('log');
  }

  cancelEdit() {
    this.editingSleep = null;
    this.editingSleepiness = null;
    this.bedtime = '';
    this.wakeTime = '';
    this.sleepinessLevel = 0;
    this.sleepinessTime = this.localDateTime();
    this.message = '';
  }

  async deleteSleep(record: SleepRecord) {
    if (this.saving || !this.ready) return;

    this.saving = true;

    try {
      await this.saveOvernight(
        this.sleepRecords.filter(item => item !== record)
      );

      if (this.editingSleep === record) {
        this.cancelEdit();
      }

      this.deletedRecord = { type: 'sleep', record };
      this.message = 'Sleep record deleted.';
      this.content?.scrollToTop(300);
    } catch {
      this.message = 'Unable to delete record.';
    } finally {
      this.saving = false;
    }
  }

  async deleteSleepiness(record: SleepinessRecord) {
    if (this.saving || !this.ready) return;

    this.saving = true;

    try {
      await this.saveDaytime(
        this.sleepinessRecords.filter(item => item !== record)
      );

      if (this.editingSleepiness === record) {
        this.cancelEdit();
      }

      this.deletedRecord = {
        type: 'sleepiness',
        record
      };

      this.message = 'Sleepiness record deleted.';
      this.content?.scrollToTop(300);
    } catch {
      this.message = 'Unable to delete record.';
    } finally {
      this.saving = false;
    }
  }

  // Restore the most recently deleted record.
  async undoDelete() {
    const deleted = this.deletedRecord;

    if (!deleted || this.saving) return;

    this.saving = true;

    try {
      if (deleted.type === 'sleep') {
        const day = deleted.record.end.slice(0, 10);

        if (this.sleepRecords.some(
          item => item.end.slice(0, 10) === day
        )) {
          this.message = 'Cannot restore: an entry exists for this day.';
          return;
        }

        await this.saveOvernight([
          deleted.record,
          ...this.sleepRecords
        ]);
      } else {
        await this.saveDaytime([
          deleted.record,
          ...this.sleepinessRecords
        ]);
      }

      this.deletedRecord = null;
      this.message = 'Record restored successfully!';
    } catch {
      this.message = 'Unable to restore record.';
    } finally {
      this.saving = false;
    }
  }

  async saveGoal() {
    if (!this.ready || this.saving) return;

    const goal = Number(this.goalDraft);

    if (!Number.isFinite(goal) || goal < 4 || goal > 12) {
      this.message = 'Enter a sleep goal between 4 and 12 hours.';
      return;
    }

    this.saving = true;

    try {
      await Preferences.set({
        key: 'sleepGoal',
        value: String(goal)
      });

      this.sleepGoal = goal;
      this.message = 'Sleep goal updated!';
    } catch {
      this.message = 'Unable to save sleep goal.';
    } finally {
      this.saving = false;
    }
  }

  get averageSleep(): number {
    if (!this.sleepRecords.length) return 0;

    const total = this.sleepRecords.reduce(
      (sum, record) => sum + record.duration, 0
    );

    return Math.round(total / this.sleepRecords.length);
  }

  get averageSleepiness(): string {
    if (!this.sleepinessRecords.length) return '—';

    const total = this.sleepinessRecords.reduce(
      (sum, record) => sum + record.level, 0
    );

    return (total / this.sleepinessRecords.length).toFixed(1);
  }

  get goalProgress(): number {
    if (!this.sleepRecords.length) return 0;

    return Math.min(
      100,
      this.sleepRecords[0].duration / (this.sleepGoal * 60) * 100
    );
  }

  get previewDuration(): number {
    const start = new Date(this.bedtime).getTime();
    const end = new Date(this.wakeTime).getTime();

    if (!Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start) return 0;

    return Math.round((end - start) / 60000);
  }

  formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
}
