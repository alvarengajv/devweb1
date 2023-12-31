/**
 * @file
 *
 * Summary.
 * <p>Draw an analog {@link https://www.timeanddate.com/worldclock/personal.html world clock}
 * using the HTML5
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API canvas API}.
 * </p>
 *
 * Description.
 * <p>Here, it has been used two canvases: one for the clock's background
 * and the other for its four handles.
 *
 * A simple method for drawing a handle consists in mapping
 * hours, minutes and seconds from the computer into angles,
 * and then mapping {@link https://en.wikipedia.org/wiki/Polar_coordinate_system polar coordinates}
 * to {@link https://en.wikipedia.org/wiki/Cartesian_coordinate_system cartesian coordinates},
 * considering 0° at three o'clock.
 * </p>
 *
 * <p>If the browser allows querying the
 * {@link https://docs.buddypunch.com/en/articles/919258-how-to-enable-location-services-for-chrome-safari-edge-and-android-ios-devices-gps-setting current geographic location}
 * (sometimes only when using a secure connection - https),
 * the {@link https://www.timeanddate.com/time/map/ time zone} of the clock is the local time
 * from the browser.
 * Otherwise, a series of locations is read from a
 * <a href="../clock/localtime.json">localtime.json</a> file,
 * and the time of each location can
 * be set by pressing the "n" or "N" keys, which cycles forward or backward between them.
 * </p>
 *
 * <p>The day light hours are indicated by means of a bright curve drawn
 * on top of the clock's circular border.</p>
 *
 * <pre>
 * Documentation:
 * - Ubuntu:
 *    - sudo apt install jsdoc-toolkit
 * - MacOS:
 *    - sudo port install npm8 (or npm9)
 *    - sudo npm install -g jsdoc
 * - jsdoc -d docjs clock/clock.js clock/suncalc.js clock/date.js
 * </pre>
 *
 * @author Paulo Roma Cavalcanti
 * @since 14/11/2020
 *
 * @see <a href="/cwdc/10-html5css3/clock/11.5.html">Local Time</a>
 * @see <a href="/cwdc/10-html5css3/clock/11.5.eng.html?timeZone=America/Edmonton">Edmonton</a>
 * @see <a href="/cwdc/10-html5css3/clock/11.5.eng.html?timeZone=America/New_York">New York</a>
 * @see <a href="/cwdc/10-html5css3/clock/clock.js">source</a>
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @see https://github.com/mourner/suncalc
 * @see <img src="../clock/clock.png">
 * @see <img src="../clock/clock2.png">
 */

"use strict";

/**
 * @var {HTMLElement} canvas HTML Canvas.
 */
var canvas = document.getElementById("clock");

/**
 * @var {CanvasRenderingContext2D} context Clock canvas context.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 */
var context = canvas.getContext("2d");

/**
 * @var {CanvasRenderingContext2D} ctx Handle canvas context.
 */
var ctx = document.getElementById("handles").getContext("2d");

/**
 * @var {CanvasRenderingContext2D} lctx Legend canvas context.
 */
var lctx = document.getElementById("legend").getContext("2d");

/** π */
const pi = Math.PI;

/** Each 5 min is 30 degrees. */
const fiveMin = pi / 6;

var style = getComputedStyle(document.head);

// Handle's origin border, III and IX, and clock border color.
const grena = style.getPropertyValue("--cgrena");

// Unused.
const green = style.getPropertyValue("--cgreen");

// Handles and day light arc color.
const orange = style.getPropertyValue("--corange");

// Handle's origin fill color.
const white = style.getPropertyValue("--cwhite");

// Roman numbers and date color.
const white1 = style.getPropertyValue("--cwhite1");

// Decimal numbers color.
const white2 = style.getPropertyValue("--cwhite2");

// 6 and 18 and 24h handle color.
const white3 = style.getPropertyValue("--cwhite3");

/**
 * Clock radius.
 * @type {Number}
 */
var clockRadius = Math.min(canvas.width, canvas.height) / 3.1;

/**
 * Canvas center.
 * @type {point}
 */
var center = [canvas.width / 2, canvas.height / 2];

/**
 * Clock location UTC offset.
 */
var cityOffset = null;

/**
 * Get the image scale.
 *
 * @param {Number} w image width.
 * @param {Number} w image height.
 * @param {Number} r clock radius.
 * @return {Number[]} scale to fit the image in the clock without distortion.
 */
function imgSize(w, h, r) {
  let d = 2 * r * 0.8;
  return [(d * w) / h, d];
}

/**
 * Sets font size and style.
 *
 * @param {Number} size font size in pixels.
 * @return {String} html font.
 */
function setFont(size) {
  return `bold ${1.2 * size}px arial`;
}

/**
 * A 2D point.
 *
 * @typedef {Object} point
 * @property {Number} x - coordinate.
 * @property {Number} y - coordinate.
 */

/**
 * A time zone geographic descriptor.
 *
 * @typedef {Object} tz
 * @property {String} tz.city - name.
 * @property {String} tz.region - TZ identifier.
 * @property {Number} tz.offset - UTC offset.
 * @property {Object} tz.geodetic
 * @property {Number} tz.geodetic.latitude - latitude.
 * @property {Number} tz.geodetic.longitude - longitude.
 * @see https://en.wikipedia.org/wiki/Geographic_coordinate_system
 */

/**
 * Convert from polar to cartesian coordinates.
 * <ul>
 * <li>Note that 0° is at three o'clock.</li>
 * <li>For the clock, however, 0° is at twelve o'clock.</li>
 * </ul>
 *
 * @param {Number} radius vector length.
 * @param {Number} angle vector angle.
 * @return {point} a 2D point.
 */
function polar2Cartesian(radius, angle) {
  angle -= (2)*pi / 2;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

/**
 * Translate a point.
 *
 * @param {point} pos given point.
 * @param {number[]} vec translation vector.
 * @return {point} a new translated point.
 */
function translate(pos, vec) {
  return {
    x: pos.x + vec[0],
    y: pos.y + vec[1],
  };
}

/**
 * Scale a vector.
 *
 * @param {point} pos given vector (pos-[0,0]).
 * @param {Number[]} vec scale factor.
 * @return {point} a new scaled vector.
 */
function scale(pos, vec) {
  return {
    x: pos[0] * vec[0],
    y: pos[1] * vec[1],
  };
}

/**
 * Draw a circle.
 *
 * @param {point} center center of the circle.
 * @param {Number} radius radius of the circle.
 * @param {Boolean} fill draws a solid or hollow circle.
 * @see https://riptutorial.com/html5-canvas/example/11126/beginpath--a-path-command-
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/closePath
 */
function circle(center, radius, fill = true) {
  context.beginPath();
  context.arc(center[0], center[1], radius, 0, 2 * pi);
  if (fill) context.fill();
  else context.stroke();
}

/**
 * Draw an arc.
 *
 * @param {point} center center of the arc.
 * @param {Number} radius radius of the arc.
 * @param {String} t1 time of start of the arc.
 * @param {String} t2 time of end of the arc.
 * @param {Boolean} fill draws a solid or hollow arc.
 * @see https://riptutorial.com/html5-canvas/example/11126/beginpath--a-path-command-
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/closePath
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc
 */
function arc(center, radius, t1, t2, fill = true) {
  let [arcInit, arcEnd] = [t1, t2].map((t) => {
    let [hour, minutes] = t.split(":").map((q) => Number(q));
    return 0.5 * (fiveMin * (hour + minutes / 60) - pi);
  });

  context.beginPath();
  context.arc(center[0], center[1], radius, arcInit, arcEnd);
  if (fill) context.fill();
  else context.stroke();
}

/**
 * Read the time zone descriptors of a set of locations from a
 * <a href="../clock/localtime.json">json file</a>.
 *
 * @async
 * @returns {Promise<Array<tz>>} array of time zones.
 */
async function readZones() {
  const requestURL = `${location.protocol}/cwdc/10-html5css3/clock/localtime.json`;
  const request = new Request(requestURL);

  const response = await fetch(request);
  const timeZonesText = await response.text();
  const timeZones = JSON.parse(timeZonesText);

  return timeZones;
}

/**
 * Get the address using
 * {@link https://wiki.openstreetmap.org/wiki/Main_Page OpenStreetMap}
 * given a geodetic location.
 *
 *
 * @param {Number} lat latitude.
 * @param {Number} long longitude.
 * @async
 * @returns {Promise<Array<String>>} <a href="../clock/Fluminense-reverse.json">address array</a>: [house_number, road, city, suburb, country].
 * @see https://operations.osmfoundation.org/policies/nominatim/
 * @see https://nominatim.openstreetmap.org/reverse?format=json&lat=-22.9369&lon=-43.1857&zoom=18&addressdetails=1
 * @see <iframe width="512" height="350"
 * src="https://www.openstreetmap.org/export/embed.html?bbox=-43.1879934668541%2C-22.93755445951262%2C-43.18112701177598%2C-22.934424772219046&amp;layer=mapnik" style="border: 1px solid black"></iframe>
 * <br/><small>
 * <a href="https://www.openstreetmap.org/#map=19/-22.93599/-43.18456">View Larger Map</a>
 * </small>
 */
async function reverseGeoCoding(lat, long) {
  const requestURL =
    "https://nominatim.openstreetmap.org/reverse?format=json&lat=" +
    lat +
    "&lon=" +
    long +
    "&zoom=18&addressdetails=1";
  const request = new Request(requestURL);

  const response = await fetch(request);
  const positionText = await response.text();
  const position = JSON.parse(positionText);

  // console.log(position);
  // Object Destructuring
  const { house_number, road, city, suburb, country } = position.address;
  return [house_number, road, city, suburb, country];
}

/**
 * Get the latitude and longitude using
 * {@link https://wiki.openstreetmap.org/wiki/Main_Page OpenStreetMap}
 * given an address, e.g. "sao_paulo,brazil" or "london,england".
 *
 * @param {String} address location.
 * @async
 * @returns {Promise<Array<Number>>} <a href="../clock/Fluminense.json">geodetic array</a>: [latitude, longitude].
 * @see https://operations.osmfoundation.org/policies/nominatim/
 * @see https://nominatim.openstreetmap.org/search?format=json&q="Fluminense Football Club"
 * @see https://leafletjs.com
 * @see <a href="../clock/Flusao.png"><img src="../clock/Flusao-512.png"></a>
 * @see <a href="../clock/Fluminense.html">Laranjeiras</a>
 */
async function geoCoding(address) {
  const requestURL = `https://nominatim.openstreetmap.org/search?format=json&q=${address}`;
  const request = new Request(requestURL);

  const response = await fetch(request);
  const geoCodingText = await response.text();
  const geoCoding = JSON.parse(geoCodingText);

  // console.log(geoCoding);
  // Object Destructuring
  const { lat, lon } = geoCoding[0];
  return [lat, lon];
}

/**
 * <p>Returns a time zone geographic descriptor given a location name.</p>
 * The {@link readZones json file} is read and searched for.
 *
 * @async
 * @param {String} name TZ identifier.
 * @returns {Promise<Array<tz>, tz>} a time zone descriptor.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
 */
async function findCity(name) {
  const tz = await readZones();
  let city;
  if (false) {
    let index = localStorage.getItem("placeIndex") || place;
    city = tz.cities[index];
  } else {
    city = tz.cities.filter(function (c) {
      return c.city == name;
    })[0];
  }
  return [tz, city];
}

/**
 * Display a time zone location in an element identified by #address
 * <ul>
 *  <li> house number, </li>
 *  <li> road, </li>
 *  <li> city, </li>
 *  <li> suburb, </li>
 *  <li> country </li>
 * </ul>
 * e.g.:
 * <pre>
 *    2, North Central Avenue, Phoenix, United States
 *    Latitude: 33.44844, Longitude: -112.07414
 * </pre>
 * @param {Number} latitude a coordinate that specifies the north–south position of a point on the surface.
 * @param {Number} longitude measures distance east or west of the prime meridian.
 * @param {String} city name of a city.
 * @param {String} region Africa | America | Asia | Atlantic | Australia | Europe | Indian | Pacific
 */
async function displayLocation(latitude, longitude, city, region) {
  let pos = await reverseGeoCoding(latitude, longitude);
  let geocode =
    city !== undefined && region !== undefined
      ? await geoCoding(`${city},${region}`)
      : [latitude, longitude];
  let tag = document.querySelector("#address");
  tag.innerHTML = `${pos
    .filter((str) => str !== undefined)
    .join(", ")} <br> Latitude: ${Number(geocode[0]).toFixed(
    5
  )}, Longitude: ${Number(geocode[1]).toFixed(5)}
        `;
}

/**
 * <p>Preloads a set of images.</p>
 * Browsers first load a compressed version of an image,
 * then decode it, and finally paint it.
 *
 * @param {String[]} urls array of Image URLs.
 * @returns {Promise<HTMLImageElement[]>} promise that resolves when all images are loaded, or rejects if any image fails to load.
 * @see https://www.freecodecamp.org/portuguese/news/tudo-o-que-voce-precisa-saber-sobre-promise-all/
 * @see https://dev.to/alejandroakbal/how-to-preload-images-for-canvas-in-javascript-251c
 */
function preloadImages(urls) {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.src = url;

      image.decode().then(() => resolve(image));
      image.onerror = () => reject(`Image failed to load: ${url}`);
    });
  });

  // Promise.all keeps the order of the promises.
  return Promise.all(promises);
}

/**
 * Draw the clock background:
 * <ul>
 *  <li>a <a href="../clock/rolex_bezel.png">bezel</a> image,</li>
 *  <li>a <a href="../clock/fluminense.png">team</a> logo,</li>
 *  <li>a {@link circle}, </li>
 *  <li>the {@link drawArc sun light arc}, </li>
 *  <li>and the ticks.</li>
 * </ul>
 *
 * @param {String} place a location name.
 * @property {function} drawClock
 * @property {function} drawClock.location Increment/decrement the clock location.
 * @property {Array<tz>} drawClock.tz time zone array.
 * @property {Array<{txt: String, c: color}>} drawClock.romans Clock roman x color.
 * @property {Array<{txt: String, c: color}>} drawClock.decimals Clock number x color.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API
 * @see https://en.wikipedia.org/wiki/Solar_time
 */
function drawClock(place) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const urls = ["./rolex_bezel.png", "./cruzeiro.png"];

  preloadImages(urls)
    .then((image) => {
      let bezel = image[0];
      // Translate the center of the bezel
      // to the center of the canvas.
      let size = imgSize(bezel.width, bezel.height, 1.8 * clockRadius);
      var coord = translate(scale(size, [-1 / 2, -1 / 2]), center);
      context.rotate = pi;
      context.drawImage(bezel, coord.x, coord.y, size[0], size[1]);
      context.setTransform(1, 0, 0, 1, 0, 0);

      let flu = image[1];
      // Translate the center of the flu logo
      // to the center of the canvas.
      size = imgSize(flu.width, flu.height, 0.9 * clockRadius);
      coord = translate(scale(size, [-1 / 2, -1 / 2]), center);
      context.drawImage(flu, coord.x, coord.y, size[0], size[1]);
      // Handle origin.
      context.strokeStyle = grena;
      context.fillStyle = white;
      circle(center, 10);
      circle(center, 10, false);
    })
    .catch((error) => {
      console.log(`Could not load iamge: ${error}`);
    });

  // context.globalAlpha = 0.3; // set global alpha

  // Draw clock border.
  context.strokeStyle = grena;
  context.lineWidth = 3;
  circle(center, clockRadius - 8, false);

  if (place !== undefined) drawClock.place = place;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // this is an asynchronous callback
      let lat = position.coords.latitude;
      let lng = position.coords.longitude;
      drawArc({
        latitude: lat,
        longitude: lng,
      });
      displayLocation(lat, lng);
    },
    async () => {
      // safari blocks geolocation unless using a secure connection
      let city;
      [drawClock.tz, city] = await findCity(drawClock.place);
      if (city) {
        let lat = city.coordinates.latitude;
        let lng = city.coordinates.longitude;
        drawArc({ latitude: lat, longitude: lng }, city.offset);
        displayLocation(lat, lng, city.city, city.region);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );

  /**
   * <p>Callback for key pressed.</p>
   * Valid keys:
   * <ul>
   *  <li>n: next city.</li>
   *  <li>N: previous city.</li>
   *  <li>b: back to cwdc</li>
   *  <li>B: back to 10-html5css3</li>
   *  <li>⌘-esc or ⌘-e: clear local storage</li>
   * </ul>
   * @event KeyboardEvent
   * @param {KeyboardEvent} event keyboard event.
   */
  window.onkeydown = function (event) {
    if (event.key === "n" || event.key === "N") {
      drawClock.location(event.key);
    } else if (event.key === "Escape" || event.key === "e") {
      if (event.metaKey || event.ctrlKey) {
        localStorage.clear();
        alert("Local storage has been cleared");
      }
    } else if (event.key == "b") {
      window.location.href = "/cwdc";
    } else if (event.key == "B") {
      let path = window.location.pathname;
      window.location.href = path.split("/", 3).join("/");
    }
  };

  /**
   * <p>A modulo function, added to Number's
   * {@link https://www.freecodecamp.org/news/a-beginners-guide-to-javascripts-prototype/ prototype},
   * that works for negative numbers.</p>
   * The modulo is calculated from remainder using the modular property:<br/>
   * • (a + b) mod c = (a mod c + b mod c) mod c.
   *
   * @function
   * @param {Number} b divisor.
   * @returns {Number} this modulo b.
   * @memberof Number
   * @global
   * @see https://en.wikipedia.org/wiki/Modulo_operation
   * @see https://www.geeksforgeeks.org/how-to-get-negative-result-using-modulo-operator-in-javascript/
   */
  Number.prototype.mod = function (b) {
    return ((this % b) + b) % b;
  };

  /**
   * Draw the sun light arc.
   *
   * @global
   * @param {Object<{latitude, longitude}>} loc location.
   * @param {Number} utcoff UTC offset.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
   * @see https://wtfjs.com/wtfs/2010-02-15-undefined-is-mutable
   */
  function drawArc(loc, utcoff) {
    let today = new Date();
    let times = SunCalc.getTimes(today, loc.latitude, loc.longitude);

    // your local timezone offset in minutes (e.g. -180).
    // NOT the timezone offset of the date object.
    let offset;
    let timezoneOffset = today.getTimezoneOffset() / 60;
    if (typeof utcoff === "undefined") {
      offset = 0;
      cityOffset = -timezoneOffset;
    } else {
      offset = timezoneOffset + utcoff;
      cityOffset = utcoff;
    }

    // format sunrise time from the Date object
    let sunriseStr =
      times.sunrise.getHours() + offset + ":" + times.sunrise.getMinutes();

    // format sunset time from the Date object
    let sunsetStr =
      times.sunset.getHours() + offset + ":" + times.sunset.getMinutes();

    console.log(sunriseStr, sunsetStr);
    context.strokeStyle = orange;
    arc(center, clockRadius - 8, sunriseStr, sunsetStr, false);
  }

  // Draw the tick numbers.
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Draw 12 inner numbers.
  context.font = setFont(clockRadius / 10);
  drawClock.romans.map((n, i) => {
    context.fillStyle = n.c;
    var coord = polar2Cartesian(0.85 * clockRadius, i * fiveMin);
    // translate to the center of the canvas
    coord = translate(coord, center);
    context.fillText(n.txt, coord.x, coord.y);
  });

  // Draw 24 outer numbers.
  context.font = setFont(clockRadius / 20);
  drawClock.decimals.map((n, i) => {
    context.fillStyle = n.c;
    // runs at half the speed
    var coord = polar2Cartesian(1.01 * clockRadius, i * fiveMin * 0.5);
    // translate to the center of the canvas
    coord = translate(coord, center);
    context.fillText(n.txt, coord.y, coord.x);
  });
}

/**
 * <p>Clock roman x color.</p>
 * Each roman number may have a different color, so it does not
 * interfere with the background color.
 * @memberof {drawClock}
 * @member {Array<{txt: String, c: color}>} roman clock numbers.
 */
drawClock.romans = [
  { txt: "III", c: white1 },
  { txt: "II", c: white1 },
  { txt: "I", c: white1 },
  { txt: "XII", c: grena },
  { txt: "XI", c: white1 },
  { txt: "X", c: white1 },
  { txt: "IX", c: white1 },
  { txt: "VIII", c: white1 },
  { txt: "  VII  ", c: white1 },
  { txt: "VI", c: grena },
  { txt: "V", c: white1 },
  { txt: "IV", c: white1 },
];

/**
 * <p>Clock number x color.</p>
 * Each number may have a different color, so it does not
 * interfere with the background color.
 * @memberof {drawClock}
 * @member {Array<{txt: String, c: color}>} decimal clock numbers.
 */
drawClock.decimals = Array.from(Array(24), (_, i) => {
  return { txt: String(i), c: white2 };
});
drawClock.decimals[0].txt = "24";
drawClock.decimals[6].c = white3;
drawClock.decimals[18].c = white3;

/**
 * Increment/decrement the clock location.
 * @async
 * @memberof {drawClock}
 * @global
 * @param {String} key "n" for next or "N" for previous.
 */
drawClock.location = async (key) => {
  if (drawClock.tz == undefined) {
    drawClock.tz = await readZones();
  }
  let index = localStorage.getItem("placeIndex") || 0;
  index = (+index + (key === "n" ? 1 : -1)).mod(drawClock.tz.cities.length);
  localStorage.setItem("placeIndex", String(index));
  let city = drawClock.tz.cities[index];
  window.location.href =
    window.location.href.split("?")[0] +
    `?timeZone=${city.region}/${city.city}`;
};

/**
 * Select next location.
 */
function nextLocation() {
  drawClock.location("n");
}

/**
 * Select previous location.
 */
function previousLocation() {
  drawClock.location("N");
}

/**
 * A closure to run the animation.
 *
 * @function
 * @return {drawHandles}
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
 * @see https://javascript.plainenglish.io/better-understanding-of-timers-in-javascript-settimeout-vs-requestanimationframe-bf7f99b9ff9b
 * @see https://attacomsian.com/blog/javascript-current-timezone
 */
var runAnimation = (() => {
  // clock handles width x length X color
  const clock_handles = [
    { width: 8, length: 0.5, c: orange },
    { width: 8, length: 0.8, c: orange },
    { width: 2, length: 0.9, c: orange },
    { width: 1, length: 0.95, c: white3 },
  ];
  const oneMin = pi / 30; // 6 degrees
  let timer = null;

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let tz = urlParams.get("timeZone") || timezone;
  let city = tz.split("/")[1];
  // lets make a copy in case this is an invalid time zone,
  // so we can keep using the original string
  let tz2 = tz;

  drawClock(city);

  /**
   * <p>A callback to redraw the four handles of the clock.</p>
   * @callback drawHandles
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
   */
  return () => {
    // '06/02/2022, 08:20:50'
    //              (0-23)  (0-59)  (0-59)
    while (true) {
      try {
        var today = new Date();
        var [day, month, year, hours, minutes, seconds] = today
          .toLocaleString("en-GB", { timeZone: tz })
          .slice()
          .split(/:|\/|,/);
        break;
      } catch (e) {
        if (e instanceof RangeError) {
          // RangeError: invalid time zone
          // e.g. no Rio de Janeiro ...
          tz = timezone;
        } else {
          console.log(e);
          throw new Error("By, bye. See you later, alligator.");
        }
      }
    }

    // 12 hours format: AM / PM
    let hours12 = hours % 12 || 12;

    clock_handles[0].time2Angle = fiveMin * (+hours12 + minutes / 60);
    clock_handles[1].time2Angle = oneMin * (+minutes + seconds / 60);
    clock_handles[2].time2Angle = oneMin * seconds;
    clock_handles[3].time2Angle = fiveMin * (+hours + minutes / 60) * 0.5;

    // Clear screen.
    lctx.clearRect(0, 0, canvas.width, canvas.height);

    let theight = canvas.width / 45;
    lctx.font = setFont(theight);
    lctx.fillStyle = white1;

    // Draw the legend: UTC, Region, City, Date.
    let date = `${day} / ${month} / ${year}`;
    let utc = `UTC ${cityOffset}`;
    let [region, lcity] = tz2.split("/");
    let [tcity, tregion, tlen, tutc] = [lcity, region, date, utc].map((p) =>
      lctx.measureText(p)
    );

    [
      [date, tlen],
      [lcity, tcity],
      [region, tregion],
      [utc, tutc],
    ].map((p, i) => {
      lctx.fillText(
        p[0],
        canvas.width - p[1].width,
        canvas.height - i * theight * 1.5
      );
    });

    lctx.lineCap = "round";

    // Clear screen.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the handles.
    clock_handles.map((handle) => {
      ctx.strokeStyle = handle.c;
      ctx.beginPath();
      coord = polar2Cartesian(0.057 * clockRadius, handle.time2Angle);
      coord = translate(coord, center);
      ctx.moveTo(coord.y, coord.x);

      var coord = polar2Cartesian(
        handle.length * clockRadius,
        handle.time2Angle
      );
      coord = translate(coord, center);
      ctx.lineTo(coord.y, coord.x);
      ctx.lineWidth = handle.width;
      ctx.stroke();
    });
    if (timer) cancelAnimationFrame(timer);
    timer = requestAnimationFrame(runAnimation);
  };
})();

/**
 * Triggers the {@link runAnimation animation}.
 *
 * @event load - run the animation.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
 */
window.addEventListener("load", (event) => runAnimation());
