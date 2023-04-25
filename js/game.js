/**
 * Component representing the memory game.
 * @component
 * @name Game
 * @property {Object} data - The data object containing the game state.
 * @property {Object} computed - The object containing computed properties.
 * @property {Object} methods - The object containing the methods used by the component.
 * @property {function} mounted - The function called after the component has been mounted.
 * @property {function} created - The function called when the component is created.
 * @export default Game
 */
import Timer from './timer.min.js';
import JsonStorage from './json-storage.min.js';

export default {
  name: 'Game',
  /**
   * Data object for the component.
   * Contains the game state.
   * @returns {Object} - The data object.
   */
  data() {
    return {
      // The player name.
      player: "",
      // The array of card objects.
      cards: [],
      // The flag indicating whether the game has started.
      //start: false,
      // The number of hits (pairs found).
      hits: 0,
      // The number of errors (mismatched pairs).
      errors: 0,
      // The timer object containing minutes and seconds properties.
      timer: {
        minutes: 0,
        seconds: 0,
      },
      // Force Vue to re-render a component.
      componentRefresh: 0,
      // Parameter to URL without refresh.
      url: {},
      // Local storage object.
      jsonStorage: {}
    }
  },
  computed: {
    /**
     * Formats seconds into a two-digit string.
     * Returns the seconds of the timer with a leading 0 if less than 10.
     *
     * @returns {string} The seconds of the timer.
     */
    sec() {
      this.jsonStorage.set("timer.seconds", this.timer.seconds);
      if(this.timer.seconds < 10) {
        return '0'+this.timer.seconds;
      }
      return this.timer.seconds;
    },
    /**
     * Formats minutes into a two-digit string.
     * Returns the minutes value of the timer as a string, with a leading zero if it's less than 10.
     *
     * @returns {string} The minutes value of the timer as a string.
     */
    min() {
      this.jsonStorage.set("timer.minutes", this.timer.minutes);
      if(this.timer.minutes < 10) {
        return '0'+this.timer.minutes;
      }
      return this.timer.minutes;
    }
  },
  methods: {
    /**
     * Returns the API methods.
     * Fetches the card data from the API.
     * 
     * @returns {Object} - The API methods object.
     */
    api() {
      return {
        getAnimals: async () => {
          const response = await fetch("https://fed-team.modyo.cloud/api/content/spaces/animals/types/game/entries?" + new URLSearchParams({
            per_page: 9
          }));

          if (!response.ok) {
            const message = `An error has occured: ${response.status}`;
            throw new Error(message);
          }

          return await response.json();
        }
      }
    },
    /**
     * Checks if the cards match.
     * 
     * @param {Object} event - The event object.
     * @returns {boolean} - Whether the cards match.
     */
    checkCards(event) {
      const countCheckedNotDisabled = document.querySelectorAll('.flip-card-trigger:checked:not(:disabled)').length;

      if(countCheckedNotDisabled > 2) {
        document.getElementById(event.target.id).checked = false;
        return false;
      }

      const cardIndex = parseInt(event.target.id.replace(/[^0-9]/g, ""));
      this.cards[cardIndex].checked = true;

      if(countCheckedNotDisabled === 2) {
        const flippedCards = this.cards.filter((card) => card.checked == true && card.disabled == false);
        
        if(flippedCards[0].uuid === flippedCards[1].uuid) {
          this.hits++;
          this.jsonStorage.set("hits", this.hits);
          flippedCards[0].disabled = true;
          flippedCards[1].disabled = true;
        } else {
          setTimeout(() => {
            this.errors++;
            this.jsonStorage.set("errors", this.errors);
            flippedCards[0].checked = false;
            flippedCards[1].checked = false;
            this.jsonStorage.set("cards", this.cards);
          }, 800);
        }
      }

      if(document.querySelectorAll('.flip-card-trigger:not(:checked)').length === 0) {
        setTimeout(() => {
          document.getElementById("congrats").classList.add("is-active");
        }, 800);
        
        this.timer.stop();
      }

      this.jsonStorage.set("cards", this.cards);

      return true;
    },
    /**
     * Resets the game by setting hits, errors,
     * sorting cards randomly, and refreshing the component.
     * 
     * @returns {void}
     */
    restart() {
      this.hits = 0;
      this.errors = 0;
      this.timer.reset();
      this.jsonStorage.clear();
      this.cards.sort( () => Math.random() - 0.5);
      this.cards.forEach((card) => {
        card.checked = false;
        card.disabled = false;
      });
      this.jsonStorage.set("cards", this.cards);
      this.componentRefresh++;
    },
    /**
     * Resets the game and starts the timer when the "play again" button is clicked.
     * 
     * @returns {void}
     */
    playAgain() {
      this.restart();
      document.getElementById("congrats").classList.remove("is-active");
      this.timer.start();
    },
    /**
     * Resets the game and starts a new one when the "new game" button is clicked.
     * 
     * @returns {void}
     */
    newGame() {
      this.restart();
      document.getElementById("congrats").classList.remove("is-active");
      this.url.searchParams.delete('player');
      window.history.replaceState(null, null, this.url);
      this.player = "";
      this.start();
    },
    /**
     * Starts the game setting the timer, and updating the game state.
     * 
     * @returns {void}
     */
    start() {
      if(this.player) {
        this.jsonStorage.set("player", this.player);
        this.url.searchParams.set("player", this.player);
        window.history.replaceState(null, null, this.url);
        this.timer.start();
        document.getElementById("signin").classList.remove("is-active");
      } else {
        document.getElementById("signin").classList.add("is-active");
      }
    }
  },
  mounted() {
    document.getElementById("loader").classList.remove("is-active");
    this.start();
  },
  created() {
    this.jsonStorage = new JsonStorage(window.localStorage);
    ["player", "cards", "hits", "errors", "timer.seconds", "timer.minutes"].forEach(key => {
      if(this.jsonStorage.get(key) === undefined) {
        this.jsonStorage.set(key, this[key]);
      } else {
        const splitKey = key.split(".");
        if(splitKey.length > 1) {
          this[splitKey[0]][splitKey[1]] = this.jsonStorage.get(key);
        } else {
          this[key] = this.jsonStorage.get(key);
        }
      }
    });

    this.url = new URL(document.location);
    this.player = this.url.searchParams.get("player");

    this.timer = new Timer(this.timer);

    if(this.cards.length > 0 && this.jsonStorage.get("player") && this.player != this.jsonStorage.get("player")) {
      this.restart();
    }

    if(this.cards.length === 0) {
      this.api().getAnimals().then(data => {
        const cards = [];
        data.entries.forEach((element,index) => {
          cards.push(Object.assign(element.fields.image, {
            checked: false,
            disabled: false
          }));
        });
        // Deep copy
        this.cards = cards.concat(structuredClone(cards)).sort( () => Math.random() - 0.5);
        this.jsonStorage.set("cards", this.cards);
      }).catch(error => window.alert(error.message));
    }
  },
}