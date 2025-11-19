declare module '@event-calendar/core' {
  export function createCalendar(container: HTMLElement, plugins: any[], options: any): any;
  export function destroyCalendar(calendar: any): void;
  export const TimeGrid: any;
}
