/**
 * Timer class to keep track of elapsed time and provide start, stop and reset functionality.
 * @class
 * @param {Object} options - The timer options.
 * @param {number} options.seconds - The initial number of seconds.
 * @param {number} options.minutes - The initial number of minutes.
 */
export default class Timer {
  intervalId = 0;

  /**
   * Creates a new Timer instance with the given seconds and minutes values.
   */
  constructor({seconds, minutes}) {
    this.seconds = seconds;
    this.minutes = minutes;
  }
  /**
   * Starts the timer.
   */
  start() {
    self = this;
    self.intervalId = setInterval(() => {
      if(self.seconds !== 59) {
        self.seconds++;
        return;
      }
      self.minutes++;
      self.seconds = 0;
    }, 1000);
  }
  /**
   * Stops the timer.
   */
  stop() {
    clearInterval(this.intervalId);
  }
  /**
   * Resets the timer to its initial state.
   */
  reset() {
    this.stop();
    self = this;
    self.seconds = 0;
    self.minutes = 0;
  }
}