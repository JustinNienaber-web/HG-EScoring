"use strict";

const SPEICHERSCHLUESSEL = "hg-escoring-laufende-runde";

const startkarte = document.querySelector(".card");

let rundeneinstellungen = {
    flightgroesse: 3,
    startloch: 1,
    spieler: [],
};

let laufendeRunde = null;

function kaufmaennischRunden(wert) {
    if (wert >= 0) {
        return Math.floor(wert + 0.5);
    }

    return Math.ceil(wert - 0.5);
}

function berechnePlatzvorgabe(handicap) {
    const ungerundeteVorgabe =
        handicap * PLATZ.slopeRating / 113
        + PLATZ.courseRating
        - PLATZ.par;

    return kaufmaennischRunden(
        ungerundeteVorgabe
    );
}

function berechneZockvorgabe(
    platzvorgabe,
    niedrigstePlatzvorgabe
) {
    const differenz =
        platzvorgabe - niedrigstePlatzvorgabe;

    return kaufmaennischRunden(
        differenz * 0.75
    );
}

function formatiereHandicap(handicap) {
    return handicap
        .toFixed(1)
        .replace(".", ",");
}

function formatiereDatum(isoDatum) {
    const [jahr, monat, tag] = isoDatum.split("-");

    return `${tag}.${monat}.${jahr}`;
}

function aktuellesDatum() {
    const jetzt = new Date();

    const jahr = jetzt.getFullYear();

    const monat = String(
        jetzt.getMonth() + 1
    ).padStart(2, "0");

    const tag = String(
        jetzt.getDate()
    ).padStart(2, "0");

    return `${jahr}-${monat}-${tag}`;
}

function aktuelleUhrzeit() {
    const jetzt = new Date();

    const stunden = String(
        jetzt.getHours()
    ).padStart(2, "0");

    const minuten = String(
        jetzt.getMinutes()
    ).padStart(2, "0");

    return `${stunden}:${minuten}`;
}

function speichereRunde() {
    localStorage.setItem(
        SPEICHERSCHLUESSEL,
        JSON.stringify(laufendeRunde)
    );
}

function ladeGespeicherteRunde() {
    const gespeicherteDaten = localStorage.getItem(
        SPEICHERSCHLUESSEL
    );

    if (!gespeicherteDaten) {
        return null;
    }

    try {
        return JSON.parse(gespeicherteDaten);
    } catch {
        localStorage.removeItem(SPEICHERSCHLUESSEL);
        return null;
    }
}

function erzeugeLochfolge(startloch) {
    if (startloch === 10) {
        return [
            10, 11, 12, 13, 14, 15, 16, 17, 18,
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ];
    }

    return [
        1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17, 18,
    ];
}

function findeLoch(lochnummer) {
    return PLATZ.loecher.find(
        (loch) => loch.nummer === lochnummer
    );
}

function berechneVorgabeschlaege(
    vorgabe,
    lochHcp
) {
    if (vorgabe >= 0) {
        const grundschlaege = Math.floor(
            vorgabe / 18
        );

        const restschlaege = vorgabe % 18;

        return grundschlaege
            + (lochHcp <= restschlaege ? 1 : 0);
    }

    const abzugebendeSchlaege = Math.abs(vorgabe);

    const grundabzug = Math.floor(
        abzugebendeSchlaege / 18
    );

    const restabzug =
        abzugebendeSchlaege % 18;

    const zusaetzlicherAbzug =
        restabzug > 0
        && lochHcp > 18 - restabzug
            ? 1
            : 0;

    return -(grundabzug + zusaetzlicherAbzug);
}

function standardScore(spieler, loch) {
    const volleVorgabe = berechneVorgabeschlaege(
        spieler.platzvorgabe,
        loch.hcp
    );

    return Math.max(
        1,
        loch.par + volleVorgabe
    );
}

function aktuelleLochnummer() {
    return laufendeRunde.lochfolge[
        laufendeRunde.aktuellerIndex
    ];
}

function holeErgebnis(lochnummer, spielerIndex) {
    return laufendeRunde.ergebnisse[
        lochnummer
    ].spieler[spielerIndex];
}

function initialisiereLochergebnisse() {
    const ergebnisse = {};

    for (const lochnummer of laufendeRunde.lochfolge) {
        const loch = findeLoch(lochnummer);

        ergebnisse[lochnummer] = {
            spieler: laufendeRunde.spieler.map(
                (spieler) => ({
                    schlaege: standardScore(
                        spieler,
                        loch
                    ),

                    sandy: false,
                })
            ),

            nearySpielerIndex: null,
        };
    }

    laufendeRunde.ergebnisse = ergebnisse;
}

function zeigeStartbildschirm() {
    laufendeRunde = ladeGespeicherteRunde();

    if (laufendeRunde) {
        zeigeGespeicherteRunde();
        return;
    }

    startkarte.innerHTML = `
        <h2>Runde starten</h2>

        <p>
            Es ist momentan keine laufende Runde auf diesem
            Gerät gespeichert.
        </p>

        <button
            id="neue-runde-button"
            class="primary-button"
            type="button"
        >
            Neue Runde starten
        </button>
    `;

    document
        .querySelector("#neue-runde-button")
        .addEventListener(
            "click",
            zeigeRundeneinrichtung
        );
}

function zeigeGespeicherteRunde() {
    const lochnummer = aktuelleLochnummer();

    startkarte.innerHTML = `
        <h2>Laufende Runde</h2>

        <div class="rundeninfo">
            <span>
                Datum
                <strong>
                    ${formatiereDatum(
                        laufendeRunde.datum
                    )}
                </strong>
            </span>

            <span>
                Startzeit
                <strong>
                    ${laufendeRunde.startzeit} Uhr
                </strong>
            </span>

            <span>
                Aktuelle Bahn
                <strong>
                    Bahn ${lochnummer}
                </strong>
            </span>
        </div>

        <button
            id="fortsetzen-button"
            class="primary-button"
            type="button"
        >
            Runde fortsetzen
        </button>

        <button
            id="neue-runde-button"
            class="secondary-button"
            type="button"
        >
            Neue Runde starten
        </button>
    `;

    document
        .querySelector("#fortsetzen-button")
        .addEventListener(
            "click",
            zeigeLochmaske
        );

    document
        .querySelector("#neue-runde-button")
        .addEventListener(
            "click",
            bestaetigeNeueRunde
        );
}

function bestaetigeNeueRunde() {
    const wirklichLoeschen = window.confirm(
        "Die vorhandene Runde wird gelöscht. "
        + "Möchtest du wirklich eine neue Runde starten?"
    );

    if (!wirklichLoeschen) {
        return;
    }

    localStorage.removeItem(SPEICHERSCHLUESSEL);
    laufendeRunde = null;

    rundeneinstellungen = {
        flightgroesse: 3,
        startloch: 1,
        spieler: [],
    };

    zeigeRundeneinrichtung();
}

function zeigeRundeneinrichtung() {
    startkarte.innerHTML = `
        <h2>Neue Runde</h2>

        <form id="rundenformular">
            <fieldset>
                <legend>Flightgröße</legend>

                <label>
                    <input
                        type="radio"
                        name="flightgroesse"
                        value="2"
                        ${rundeneinstellungen.flightgroesse === 2
                            ? "checked"
                            : ""}
                    >
                    2 Spieler
                </label>

                <label>
                    <input
                        type="radio"
                        name="flightgroesse"
                        value="3"
                        ${rundeneinstellungen.flightgroesse === 3
                            ? "checked"
                            : ""}
                    >
                    3 Spieler
                </label>

                <label>
                    <input
                        type="radio"
                        name="flightgroesse"
                        value="4"
                        ${rundeneinstellungen.flightgroesse === 4
                            ? "checked"
                            : ""}
                    >
                    4 Spieler
                </label>
            </fieldset>

            <fieldset>
                <legend>Startloch</legend>

                <label>
                    <input
                        type="radio"
                        name="startloch"
                        value="1"
                        ${rundeneinstellungen.startloch === 1
                            ? "checked"
                            : ""}
                    >
                    Tee 1
                </label>

                <label>
                    <input
                        type="radio"
                        name="startloch"
                        value="10"
                        ${rundeneinstellungen.startloch === 10
                            ? "checked"
                            : ""}
                    >
                    Tee 10
                </label>
            </fieldset>

            <button
                class="primary-button"
                type="submit"
            >
                Weiter zu den Spielern
            </button>

            <button
                id="abbrechen-button"
                class="secondary-button"
                type="button"
            >
                Abbrechen
            </button>
        </form>
    `;

    document
        .querySelector("#abbrechen-button")
        .addEventListener(
            "click",
            zeigeStartbildschirm
        );

    document
        .querySelector("#rundenformular")
        .addEventListener(
            "submit",
            verarbeiteRundenauswahl
        );
}

function verarbeiteRundenauswahl(event) {
    event.preventDefault();

    const formulardaten = new FormData(event.target);

    rundeneinstellungen.flightgroesse = Number(
        formulardaten.get("flightgroesse")
    );

    rundeneinstellungen.startloch = Number(
        formulardaten.get("startloch")
    );

    zeigeSpielereingabe();
}

function erzeugeSpielerfelder() {
    let spielerfelder = "";

    for (
        let index = 0;
        index < rundeneinstellungen.flightgroesse;
        index += 1
    ) {
        const spielernummer = index + 1;

        const vorhandenerSpieler =
            rundeneinstellungen.spieler[index];

        const name = vorhandenerSpieler
            ? vorhandenerSpieler.name
            : `Spieler ${spielernummer}`;

        const handicap = vorhandenerSpieler
            ? vorhandenerSpieler.handicap
            : 0;

        const istVierer =
            rundeneinstellungen.flightgroesse === 4;

        const teamnummer = index < 2 ? 1 : 2;

        const teamklasse = istVierer
            ? `team-${teamnummer}`
            : "";

        const teamauszeichnung = istVierer
            ? `
                <span class="team-label">
                    Team ${teamnummer}
                </span>
            `
            : "";

        spielerfelder += `
            <section class="spielerkarte ${teamklasse}">
                <div class="spielerkarte-kopf">
                    <h3>Spieler ${spielernummer}</h3>
                    ${teamauszeichnung}
                </div>

                <label class="eingabefeld">
                    <span>Name</span>

                    <input
                        type="text"
                        name="spielername-${index}"
                        value="${name}"
                        autocomplete="off"
                        required
                    >
                </label>

                <label class="eingabefeld">
                    <span>Handicap Index</span>

                    <input
                        type="number"
                        name="handicap-${index}"
                        value="${handicap.toFixed(1)}"
                        min="-10"
                        max="54"
                        step="0.1"
                        inputmode="decimal"
                        required
                    >
                </label>
            </section>
        `;
    }

    return spielerfelder;
}

function zeigeSpielereingabe() {
    startkarte.innerHTML = `
        <h2>Spieler festlegen</h2>

        <p class="auswahl-zusammenfassung">
            ${rundeneinstellungen.flightgroesse} Spieler
            · Start an Tee ${rundeneinstellungen.startloch}
        </p>

        <form id="spielerformular">
            <div class="spielerliste">
                ${erzeugeSpielerfelder()}
            </div>

            <button
                class="primary-button"
                type="submit"
            >
                Vorgaben berechnen
            </button>

            <button
                id="zurueck-button"
                class="secondary-button"
                type="button"
            >
                Zurück
            </button>
        </form>
    `;

    document
        .querySelector("#zurueck-button")
        .addEventListener(
            "click",
            zeigeRundeneinrichtung
        );

    document
        .querySelector("#spielerformular")
        .addEventListener(
            "submit",
            verarbeiteSpielerdaten
        );
}

function verarbeiteSpielerdaten(event) {
    event.preventDefault();

    const formulardaten = new FormData(event.target);
    const spieler = [];

    for (
        let index = 0;
        index < rundeneinstellungen.flightgroesse;
        index += 1
    ) {
        const handicap = Number(
            formulardaten.get(`handicap-${index}`)
        );

        spieler.push({
            name: formulardaten
                .get(`spielername-${index}`)
                .trim(),

            handicap,

            platzvorgabe:
                berechnePlatzvorgabe(handicap),
        });
    }

    const niedrigstePlatzvorgabe = Math.min(
        ...spieler.map(
            (einzelnerSpieler) =>
                einzelnerSpieler.platzvorgabe
        )
    );

    for (const einzelnerSpieler of spieler) {
        einzelnerSpieler.zockvorgabe =
            berechneZockvorgabe(
                einzelnerSpieler.platzvorgabe,
                niedrigstePlatzvorgabe
            );
    }

    rundeneinstellungen.spieler = spieler;

    zeigeKontrollansicht();
}

function erzeugeSpieleruebersicht() {
    return rundeneinstellungen.spieler
        .map(
            (spieler, index) => {
                const istVierer =
                    rundeneinstellungen.flightgroesse === 4;

                const teamnummer = index < 2 ? 1 : 2;

                const teamtext = istVierer
                    ? `<span>Team ${teamnummer}</span>`
                    : "";

                return `
                    <li>
                        <strong>${spieler.name}</strong>

                        ${teamtext}

                        <span>
                            HCP ${formatiereHandicap(
                                spieler.handicap
                            )}
                        </span>

                        <span>
                            Platzvorgabe:
                            <strong>
                                ${spieler.platzvorgabe}
                            </strong>
                        </span>

                        <span>
                            Zockvorgabe:
                            <strong>
                                ${spieler.zockvorgabe}
                            </strong>
                        </span>
                    </li>
                `;
            }
        )
        .join("");
}

function zeigeKontrollansicht() {
    startkarte.innerHTML = `
        <h2>Runde vorbereitet</h2>

        <p class="auswahl-zusammenfassung">
            ${rundeneinstellungen.flightgroesse} Spieler
            · Start an Tee ${rundeneinstellungen.startloch}
        </p>

        <ul class="vorgabenliste">
            ${erzeugeSpieleruebersicht()}
        </ul>

        <button
            id="runde-starten-button"
            class="primary-button"
            type="button"
        >
            Runde starten
        </button>

        <button
            id="spieler-aendern-button"
            class="secondary-button"
            type="button"
        >
            Spielerdaten ändern
        </button>
    `;

    document
        .querySelector("#spieler-aendern-button")
        .addEventListener(
            "click",
            zeigeSpielereingabe
        );

    document
        .querySelector("#runde-starten-button")
        .addEventListener(
            "click",
            starteRunde
        );
}

function starteRunde() {
    laufendeRunde = {
        id:
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : String(Date.now()),

        datum: aktuellesDatum(),
        startzeit: aktuelleUhrzeit(),

        flightgroesse:
            rundeneinstellungen.flightgroesse,

        startloch:
            rundeneinstellungen.startloch,

        spieler:
            rundeneinstellungen.spieler,

        lochfolge:
            erzeugeLochfolge(
                rundeneinstellungen.startloch
            ),

        aktuellerIndex: 0,
        ergebnisse: {},
        status: "laufend",
    };

    initialisiereLochergebnisse();
    speichereRunde();
    zeigeLochmaske();
}

function erzeugeScorekarten(loch) {
    return laufendeRunde.spieler
        .map(
            (spieler, index) => {
                const ergebnis = holeErgebnis(
                    loch.nummer,
                    index
                );

                const sandyAuswahl =
                    ergebnis.schlaege <= loch.par
                        ? `
                            <label class="sandy-auswahl">
                                <input
                                    type="checkbox"
                                    data-aktion="sandy"
                                    data-spieler="${index}"
                                    ${ergebnis.sandy
                                        ? "checked"
                                        : ""}
                                >
                                Sandy
                            </label>
                        `
                        : "";

                return `
                    <section class="scorekarte">
                        <div class="scorekarte-kopf">
                            <strong>${spieler.name}</strong>

                            <span>
                                Zockvorgabe
                                ${spieler.zockvorgabe}
                            </span>
                        </div>

                        <div class="score-stepper">
                            <button
                                type="button"
                                data-aktion="minus"
                                data-spieler="${index}"
                                aria-label="Schlagzahl verringern"
                            >
                                −
                            </button>

                            <output>
                                ${ergebnis.schlaege}
                            </output>

                            <button
                                type="button"
                                data-aktion="plus"
                                data-spieler="${index}"
                                aria-label="Schlagzahl erhöhen"
                            >
                                +
                            </button>
                        </div>

                        ${sandyAuswahl}
                    </section>
                `;
            }
        )
        .join("");
}

function berechtigteNearySpieler(loch) {
    if (loch.par !== 3) {
        return [];
    }

    return laufendeRunde.spieler
        .map(
            (spieler, index) => ({
                spieler,
                index,

                ergebnis: holeErgebnis(
                    loch.nummer,
                    index
                ),
            })
        )
        .filter(
            (eintrag) =>
                eintrag.ergebnis.schlaege <= loch.par
                && !eintrag.ergebnis.sandy
        );
}

function erzeugeNearyAuswahl(loch) {
    const berechtigteSpieler =
        berechtigteNearySpieler(loch);

    if (berechtigteSpieler.length === 0) {
        return "";
    }

    const lochergebnis =
        laufendeRunde.ergebnisse[loch.nummer];

    const optionen = berechtigteSpieler
        .map(
            ({ spieler, index }) => `
                <option
                    value="${index}"
                    ${lochergebnis.nearySpielerIndex === index
                        ? "selected"
                        : ""}
                >
                    ${spieler.name}
                </option>
            `
        )
        .join("");

    return `
        <section class="neary-bereich">
            <label for="neary-auswahl">
                Nearest to the Pin
            </label>

            <select id="neary-auswahl">
                <option
                    value=""
                    ${lochergebnis.nearySpielerIndex === null
                        ? "selected"
                        : ""}
                >
                    Kein Neary
                </option>

                ${optionen}
            </select>
        </section>
    `;
}

function zeigeLochmaske() {
    const lochnummer = aktuelleLochnummer();
    const loch = findeLoch(lochnummer);

    const istLetztesLoch =
        laufendeRunde.aktuellerIndex === 17;

    const kannZurueck =
        laufendeRunde.aktuellerIndex > 0;

    let teamZwischenstand = "";

    if (laufendeRunde.flightgroesse === 4) {
        const teamPunkte = [0, 0];

        for (
            let index = 0;
            index <= laufendeRunde.aktuellerIndex;
            index += 1
        ) {
            const bisherigeLochnummer =
                laufendeRunde.lochfolge[index];

            const bisherigesLoch =
                findeLoch(bisherigeLochnummer);

            const bisherigesErgebnis =
                laufendeRunde
                    .ergebnisse[bisherigeLochnummer];

            const nettoscores =
                bisherigesErgebnis.spieler.map(
                    (ergebnis, spielerIndex) => {
                        const spieler =
                            laufendeRunde
                                .spieler[spielerIndex];

                        const vorgabeschlaege =
                            berechneVorgabeschlaege(
                                spieler.zockvorgabe,
                                bisherigesLoch.hcp
                            );

                        return (
                            ergebnis.schlaege
                            - vorgabeschlaege
                        );
                    }
                );

            const lochwertung =
                ermittleTeamLochpunkte(
                    nettoscores
                );

            teamPunkte[0] +=
                lochwertung.bestball[0]
                + lochwertung.aggregat[0];

            teamPunkte[1] +=
                lochwertung.bestball[1]
                + lochwertung.aggregat[1];
        }

        const differenz =
            teamPunkte[0] - teamPunkte[1];

        let standText = "Even";
        let standKlasse = "stand-even";

        if (differenz > 0) {
            standText = `Team 1 +${differenz}`;
            standKlasse = "stand-team-1";
        }

        if (differenz < 0) {
            standText =
                `Team 2 +${Math.abs(differenz)}`;

            standKlasse = "stand-team-2";
        }

        teamZwischenstand = `
            <div class="team-zwischenstand ${standKlasse}">
                ${standText}
            </div>
        `;
    }

    startkarte.innerHTML = `
        <div class="loch-kopf">
            <button
                id="home-button"
                class="home-button"
                type="button"
                aria-label="Zum Startbildschirm"
            >
                &#8962; Home
            </button>

            ${teamZwischenstand}

            <span>
                ${laufendeRunde.aktuellerIndex + 1}
                von 18
            </span>

            <h2>Bahn ${loch.nummer}</h2>

            <div class="lochdaten">
                <strong>Par ${loch.par}</strong>
                <strong>HCP ${loch.hcp}</strong>
            </div>
        </div>

        <div class="scorekarten">
            ${erzeugeScorekarten(loch)}
        </div>

        ${erzeugeNearyAuswahl(loch)}

        <div class="loch-navigation">
            <button
                id="vorheriges-loch-button"
                class="secondary-button"
                type="button"
                ${kannZurueck ? "" : "disabled"}
            >
                Zurück
            </button>

            <button
                id="naechstes-loch-button"
                class="primary-button"
                type="button"
            >
                ${istLetztesLoch
                    ? "Runde beenden"
                    : "Weiter"}
            </button>
        </div>
    `;

    document
        .querySelector("#home-button")
        .addEventListener(
            "click",
            geheZumStartbildschirm
        );

    document
        .querySelectorAll("[data-aktion]")
        .forEach(
            (element) => {
                element.addEventListener(
                    "click",
                    verarbeiteScoreAktion
                );
            }
        );

    const nearyAuswahl = document.querySelector(
        "#neary-auswahl"
    );

    if (nearyAuswahl) {
        nearyAuswahl.addEventListener(
            "change",
            verarbeiteNearyAuswahl
        );
    }

    document
        .querySelector("#vorheriges-loch-button")
        .addEventListener(
            "click",
            geheZumVorherigenLoch
        );

    document
        .querySelector("#naechstes-loch-button")
        .addEventListener(
            "click",
            geheZumNaechstenLoch
        );
}

function geheZumStartbildschirm() {
    speichereRunde();
    zeigeStartbildschirm();
}

function verarbeiteScoreAktion(event) {
    const aktion = event.currentTarget.dataset.aktion;

    const spielerIndex = Number(
        event.currentTarget.dataset.spieler
    );

    const lochnummer = aktuelleLochnummer();
    const loch = findeLoch(lochnummer);

    const ergebnis = holeErgebnis(
        lochnummer,
        spielerIndex
    );

    if (aktion === "plus") {
        ergebnis.schlaege += 1;
    }

    if (aktion === "minus") {
        ergebnis.schlaege = Math.max(
            1,
            ergebnis.schlaege - 1
        );
    }

    if (aktion === "sandy") {
        ergebnis.sandy =
            event.currentTarget.checked;

        const lochergebnis =
            laufendeRunde.ergebnisse[lochnummer];

        if (
            ergebnis.sandy
            && lochergebnis.nearySpielerIndex
                === spielerIndex
        ) {
            lochergebnis.nearySpielerIndex = null;
        }
    }

    if (ergebnis.schlaege > loch.par) {
        ergebnis.sandy = false;
    }

    const lochergebnis =
        laufendeRunde.ergebnisse[lochnummer];

    const nearyIndex =
        lochergebnis.nearySpielerIndex;

    if (nearyIndex !== null) {
        const nearyErgebnis = holeErgebnis(
            lochnummer,
            nearyIndex
        );

        if (nearyErgebnis.schlaege > loch.par) {
            lochergebnis.nearySpielerIndex = null;
        }
    }

    speichereRunde();
    zeigeLochmaske();
}

function verarbeiteNearyAuswahl(event) {
    const lochnummer = aktuelleLochnummer();

    const ausgewaehlterWert =
        event.target.value;

    laufendeRunde
        .ergebnisse[lochnummer]
        .nearySpielerIndex =
            ausgewaehlterWert === ""
                ? null
                : Number(ausgewaehlterWert);

    speichereRunde();
}

function geheZumVorherigenLoch() {
    if (laufendeRunde.aktuellerIndex === 0) {
        return;
    }

    laufendeRunde.aktuellerIndex -= 1;

    speichereRunde();
    zeigeLochmaske();
}

function geheZumNaechstenLoch() {
    if (laufendeRunde.aktuellerIndex === 17) {
        zeigeEndauswertung();
        return;
    }

    laufendeRunde.aktuellerIndex += 1;

    speichereRunde();
    zeigeLochmaske();
}

zeigeStartbildschirm();
if ("serviceWorker" in navigator) {
    window.addEventListener(
        "load",
        () => {
            navigator.serviceWorker.register(
                "./service-worker.js"
            );
        }
    );
}
