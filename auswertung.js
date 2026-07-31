"use strict";

function formatierePunkte(wert) {
    return Number.isInteger(wert)
        ? String(wert)
        : wert.toFixed(1).replace(".", ",");
}

function formatiereEuro(wert) {
    return `${wert.toFixed(2).replace(".", ",")} €`;
}

function rundeAufFuenfzigCent(wert) {
    return Math.round(wert * 2) / 2;
}

function berechneSonderpunkte(
    ergebnis,
    loch,
    istNeary
) {
    let birdiePunkte = 0;

    if (ergebnis.schlaege === loch.par - 1) {
        birdiePunkte = 1;
    }

    if (ergebnis.schlaege <= loch.par - 2) {
        birdiePunkte = 2;
    }

    const sandyPunkte =
        ergebnis.sandy ? 1 : 0;

    const nearyPunkte =
        istNeary ? 1 : 0;

    return {
        birdiePunkte,
        sandyPunkte,
        nearyPunkte,

        gesamt:
            birdiePunkte
            + sandyPunkte
            + nearyPunkte,
    };
}

function ermittleEinzelLochpunkte(nettoscores) {
    const niedrigsterScore = Math.min(
        ...nettoscores
    );

    const gewinner = nettoscores
        .map(
            (score, index) => ({
                score,
                index,
            })
        )
        .filter(
            (eintrag) =>
                eintrag.score === niedrigsterScore
        )
        .map(
            (eintrag) => eintrag.index
        );

    const lochpunkte = nettoscores.map(() => 0);

    if (nettoscores.length === 2) {
        if (gewinner.length === 1) {
            lochpunkte[gewinner[0]] = 1;
        } else {
            lochpunkte[0] = 0.5;
            lochpunkte[1] = 0.5;
        }

        return lochpunkte;
    }

    if (nettoscores.length === 3) {
        if (gewinner.length === 1) {
            lochpunkte[gewinner[0]] = 1;
        }

        if (gewinner.length === 2) {
            lochpunkte[gewinner[0]] = 0.5;
            lochpunkte[gewinner[1]] = 0.5;
        }
    }

    return lochpunkte;
}

function ermittleTeamLochpunkte(nettoscores) {
    const team1Scores = [
        nettoscores[0],
        nettoscores[1],
    ];

    const team2Scores = [
        nettoscores[2],
        nettoscores[3],
    ];

    const bestballTeam1 = Math.min(
        ...team1Scores
    );

    const bestballTeam2 = Math.min(
        ...team2Scores
    );

    const aggregatTeam1 =
        team1Scores[0] + team1Scores[1];

    const aggregatTeam2 =
        team2Scores[0] + team2Scores[1];

    const ergebnis = {
        bestball: [0, 0],
        aggregat: [0, 0],
    };

    if (bestballTeam1 < bestballTeam2) {
        ergebnis.bestball[0] = 1;
    }

    if (bestballTeam2 < bestballTeam1) {
        ergebnis.bestball[1] = 1;
    }

    if (aggregatTeam1 < aggregatTeam2) {
        ergebnis.aggregat[0] = 1;
    }

    if (aggregatTeam2 < aggregatTeam1) {
        ergebnis.aggregat[1] = 1;
    }

    return ergebnis;
}

function berechneRundenauswertung() {
    const spielerwerte = laufendeRunde.spieler.map(
        (spieler) => ({
            name: spieler.name,
            handicap: spieler.handicap,
            platzvorgabe: spieler.platzvorgabe,
            zockvorgabe: spieler.zockvorgabe,

            brutto: 0,
            netto: 0,
            lochpunkte: 0,

            birdies: 0,
            eagles: 0,
            sandys: 0,
            nearies: 0,
            sonderpunkte: 0,
        })
    );

    const teamwerte = [
        {
            bestball: 0,
            aggregat: 0,
            sonderpunkte: 0,
            handicapSumme:
                laufendeRunde.spieler.length === 4
                    ? laufendeRunde.spieler[0].handicap
                        + laufendeRunde.spieler[1].handicap
                    : 0,
        },
        {
            bestball: 0,
            aggregat: 0,
            sonderpunkte: 0,
            handicapSumme:
                laufendeRunde.spieler.length === 4
                    ? laufendeRunde.spieler[2].handicap
                        + laufendeRunde.spieler[3].handicap
                    : 0,
        },
    ];

    for (
        const lochnummer
        of laufendeRunde.lochfolge
    ) {
        const loch = findeLoch(lochnummer);

        const lochergebnis =
            laufendeRunde.ergebnisse[lochnummer];

        const zockNettoscores = [];

        lochergebnis.spieler.forEach(
            (ergebnis, index) => {
                const spieler =
                    laufendeRunde.spieler[index];

                const volleSchlaege =
                    berechneVorgabeschlaege(
                        spieler.platzvorgabe,
                        loch.hcp
                    );

                const zockSchlaege =
                    berechneVorgabeschlaege(
                        spieler.zockvorgabe,
                        loch.hcp
                    );

                spielerwerte[index].brutto +=
                    ergebnis.schlaege;

                spielerwerte[index].netto +=
                    ergebnis.schlaege
                    - volleSchlaege;

                zockNettoscores.push(
                    ergebnis.schlaege
                    - zockSchlaege
                );

                const istNeary =
                    lochergebnis.nearySpielerIndex
                    === index;

                const sonderpunkte =
                    berechneSonderpunkte(
                        ergebnis,
                        loch,
                        istNeary
                    );

                spielerwerte[index].sonderpunkte +=
                    sonderpunkte.gesamt;

                spielerwerte[index].sandys +=
                    sonderpunkte.sandyPunkte;

                spielerwerte[index].nearies +=
                    sonderpunkte.nearyPunkte;

                if (sonderpunkte.birdiePunkte === 1) {
                    spielerwerte[index].birdies += 1;
                }

                if (sonderpunkte.birdiePunkte === 2) {
                    spielerwerte[index].eagles += 1;
                }

                if (laufendeRunde.flightgroesse === 4) {
                    const teamIndex =
                        index < 2 ? 0 : 1;

                    teamwerte[
                        teamIndex
                    ].sonderpunkte +=
                        sonderpunkte.gesamt;
                }
            }
        );

        if (laufendeRunde.flightgroesse < 4) {
            const lochpunkte =
                ermittleEinzelLochpunkte(
                    zockNettoscores
                );

            lochpunkte.forEach(
                (punkte, index) => {
                    spielerwerte[index].lochpunkte +=
                        punkte;
                }
            );
        }

        if (laufendeRunde.flightgroesse === 4) {
            const teampunkte =
                ermittleTeamLochpunkte(
                    zockNettoscores
                );

            teamwerte[0].bestball +=
                teampunkte.bestball[0];

            teamwerte[1].bestball +=
                teampunkte.bestball[1];

            teamwerte[0].aggregat +=
                teampunkte.aggregat[0];

            teamwerte[1].aggregat +=
                teampunkte.aggregat[1];
        }
    }

    for (const team of teamwerte) {
        team.lochpunkte =
            team.bestball + team.aggregat;
    }

    return {
        spielerwerte,
        teamwerte,
    };
}

function erzeugeTheoretischeZahlungen(cashflows) {
    const schuldner = [];
    const empfaenger = [];

    cashflows.forEach(
        (cashflow, index) => {
            if (cashflow < 0) {
                schuldner.push({
                    index,
                    betrag: Math.abs(cashflow),
                });
            }

            if (cashflow > 0) {
                empfaenger.push({
                    index,
                    betrag: cashflow,
                });
            }
        }
    );

    const zahlungen = [];

    let schuldnerPosition = 0;
    let empfaengerPosition = 0;

    while (
        schuldnerPosition < schuldner.length
        && empfaengerPosition < empfaenger.length
    ) {
        const schuld =
            schuldner[schuldnerPosition];

        const forderung =
            empfaenger[empfaengerPosition];

        const betrag = Math.min(
            schuld.betrag,
            forderung.betrag
        );

        zahlungen.push({
            von: schuld.index,
            an: forderung.index,
            betrag,
        });

        schuld.betrag -= betrag;
        forderung.betrag -= betrag;

        if (schuld.betrag < 0.001) {
            schuldnerPosition += 1;
        }

        if (forderung.betrag < 0.001) {
            empfaengerPosition += 1;
        }
    }

    return zahlungen;
}

function verteileBegrenzteZahlungen(
    zahlungenEinesSpielers
) {
    const gesamtschuld =
        zahlungenEinesSpielers.reduce(
            (summe, zahlung) =>
                summe + zahlung.betrag,
            0
        );

    if (gesamtschuld <= 10) {
        return zahlungenEinesSpielers.map(
            (zahlung) => ({
                ...zahlung,
                betrag: rundeAufFuenfzigCent(
                    zahlung.betrag
                ),
            })
        );
    }

    if (zahlungenEinesSpielers.length === 1) {
        return [
            {
                ...zahlungenEinesSpielers[0],
                betrag: 10,
            },
        ];
    }

    const zielEinheiten = 20;

    const verteilung =
        zahlungenEinesSpielers.map(
            (zahlung) => {
                const anteil =
                    zahlung.betrag / gesamtschuld;

                const genaueEinheiten =
                    anteil * zielEinheiten;

                const ganzeEinheiten =
                    Math.floor(genaueEinheiten);

                return {
                    ...zahlung,
                    einheiten: ganzeEinheiten,
                    rest:
                        genaueEinheiten
                        - ganzeEinheiten,
                };
            }
        );

    let fehlendeEinheiten =
        zielEinheiten
        - verteilung.reduce(
            (summe, zahlung) =>
                summe + zahlung.einheiten,
            0
        );

    const nachRestSortiert = [
        ...verteilung,
    ].sort(
        (a, b) => b.rest - a.rest
    );

    for (
        let index = 0;
        index < nachRestSortiert.length
            && fehlendeEinheiten > 0;
        index += 1
    ) {
        nachRestSortiert[index].einheiten += 1;
        fehlendeEinheiten -= 1;
    }

    return verteilung.map(
        (zahlung) => ({
            von: zahlung.von,
            an: zahlung.an,
            betrag: zahlung.einheiten * 0.5,
        })
    );
}

function begrenzeZahlungenAufZehnEuro(
    theoretischeZahlungen
) {
    const endgueltigeZahlungen = [];

    for (
        let spielerIndex = 0;
        spielerIndex < 3;
        spielerIndex += 1
    ) {
        const eigeneZahlungen =
            theoretischeZahlungen.filter(
                (zahlung) =>
                    zahlung.von === spielerIndex
            );

        if (eigeneZahlungen.length === 0) {
            continue;
        }

        endgueltigeZahlungen.push(
            ...verteileBegrenzteZahlungen(
                eigeneZahlungen
            )
        );
    }

    return endgueltigeZahlungen.filter(
        (zahlung) => zahlung.betrag > 0
    );
}

function berechneDreierCashflow(spielerwerte) {
    const gesamtpunkte = spielerwerte.map(
        (spieler) =>
            spieler.lochpunkte
            + spieler.sonderpunkte
    );

    const punkteImSpiel = gesamtpunkte.reduce(
        (summe, punkte) => summe + punkte,
        0
    );

    const theoretischeCashflows =
        gesamtpunkte.map(
            (punkte) =>
                punkte * 3 - punkteImSpiel
        );

    const theoretischeZahlungen =
        erzeugeTheoretischeZahlungen(
            theoretischeCashflows
        );

    const zahlungen =
        begrenzeZahlungenAufZehnEuro(
            theoretischeZahlungen
        );

    const endgueltigeCashflows = [0, 0, 0];

    zahlungen.forEach(
        (zahlung) => {
            endgueltigeCashflows[zahlung.von] -=
                zahlung.betrag;

            endgueltigeCashflows[zahlung.an] +=
                zahlung.betrag;
        }
    );

    return {
        gesamtpunkte,
        punkteImSpiel,
        theoretischeCashflows,
        endgueltigeCashflows,
        zahlungen,
    };
}

function berechneViererCashflow(teamwerte) {
    let siegerTeamIndex = null;
    let entscheidung = "";

    if (
        teamwerte[0].lochpunkte
        !== teamwerte[1].lochpunkte
    ) {
        siegerTeamIndex =
            teamwerte[0].lochpunkte
                > teamwerte[1].lochpunkte
                ? 0
                : 1;

        entscheidung = "Lochpunkte";
    } else if (
        teamwerte[0].sonderpunkte
        !== teamwerte[1].sonderpunkte
    ) {
        siegerTeamIndex =
            teamwerte[0].sonderpunkte
                > teamwerte[1].sonderpunkte
                ? 0
                : 1;

        entscheidung = "Sonderpunkte";
    } else {
        siegerTeamIndex =
            teamwerte[0].handicapSumme
                >= teamwerte[1].handicapSumme
                ? 0
                : 1;

        entscheidung = "Handicap-Summe";
    }

    const verliererTeamIndex =
        siegerTeamIndex === 0 ? 1 : 0;

    const sieger = teamwerte[siegerTeamIndex];
    const verlierer =
        teamwerte[verliererTeamIndex];

    const lochpunktVorsprung = Math.abs(
        sieger.lochpunkte
        - verlierer.lochpunkte
    );

    const rechnerischerBetrag =
        lochpunktVorsprung
        + 1
        + sieger.sonderpunkte
        - verlierer.sonderpunkte;

    const auszahlung = Math.min(
        10,
        Math.max(5, rechnerischerBetrag)
    );

    const siegerSpieler =
        siegerTeamIndex === 0
            ? [0, 1]
            : [2, 3];

    const verliererSpieler =
        verliererTeamIndex === 0
            ? [0, 1]
            : [2, 3];

    const zahlungen = [
        {
            von: verliererSpieler[0],
            an: siegerSpieler[0],
            betrag: auszahlung,
        },
        {
            von: verliererSpieler[1],
            an: siegerSpieler[1],
            betrag: auszahlung,
        },
    ];

    return {
        siegerTeamIndex,
        verliererTeamIndex,
        entscheidung,
        lochpunktVorsprung,
        siegespunkt: 1,
        sonderpunkteSieger:
            sieger.sonderpunkte,
        sonderpunkteVerlierer:
            verlierer.sonderpunkte,
        rechnerischerBetrag,
        auszahlung,
        zahlungen,
    };
}

function erzeugeSpielerEndkarten(spielerwerte) {
    return spielerwerte
        .map(
            (spieler) => {
                const lochpunkteZeile =
                    laufendeRunde.flightgroesse < 4
                        ? `
                            <div>
                                <dt>Lochpunkte</dt>
                                <dd>
                                    ${formatierePunkte(
                                        spieler.lochpunkte
                                    )}
                                </dd>
                            </div>
                        `
                        : "";

                return `
                    <section class="endkarte">
                        <h3>${spieler.name}</h3>

                        <dl>
                            <div>
                                <dt>Bruttoschläge</dt>
                                <dd>${spieler.brutto}</dd>
                            </div>

                            <div>
                                <dt>Nettoschläge</dt>
                                <dd>${spieler.netto}</dd>
                            </div>

                            ${lochpunkteZeile}

                            <div>
                                <dt>Birdies</dt>
                                <dd>${spieler.birdies}</dd>
                            </div>

                            <div>
                                <dt>Eagles</dt>
                                <dd>${spieler.eagles}</dd>
                            </div>

                            <div>
                                <dt>Sandys</dt>
                                <dd>${spieler.sandys}</dd>
                            </div>

                            <div>
                                <dt>Nearies</dt>
                                <dd>${spieler.nearies}</dd>
                            </div>

                            <div class="hervorgehoben">
                                <dt>Sonderpunkte</dt>
                                <dd>
                                    ${spieler.sonderpunkte}
                                </dd>
                            </div>
                        </dl>
                    </section>
                `;
            }
        )
        .join("");
}

function erzeugeTeamEndkarten(teamwerte) {
    if (laufendeRunde.flightgroesse !== 4) {
        return "";
    }

    return `
        <h2>Teamwertung</h2>

        <div class="team-endkarten">
            ${teamwerte.map(
                (team, index) => `
                    <section
                        class="endkarte team-${index + 1}"
                    >
                        <h3>Team ${index + 1}</h3>

                        <p>
                            ${laufendeRunde
                                .spieler[index * 2].name}
                            und
                            ${laufendeRunde
                                .spieler[index * 2 + 1].name}
                        </p>

                        <dl>
                            <div>
                                <dt>Bestball</dt>
                                <dd>${team.bestball}</dd>
                            </div>

                            <div>
                                <dt>Aggregat</dt>
                                <dd>${team.aggregat}</dd>
                            </div>

                            <div class="hervorgehoben">
                                <dt>Lochpunkte</dt>
                                <dd>${team.lochpunkte}</dd>
                            </div>

                            <div>
                                <dt>Sonderpunkte</dt>
                                <dd>
                                    ${team.sonderpunkte}
                                </dd>
                            </div>

                            <div>
                                <dt>Handicap-Summe</dt>
                                <dd>
                                    ${formatierePunkte(
                                        team.handicapSumme
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>
                `
            ).join("")}
        </div>
    `;
}

function erzeugeZahlungsliste(zahlungen) {
    return zahlungen
        .map(
            (zahlung) => `
                <li>
                    <strong>
                        ${laufendeRunde
                            .spieler[zahlung.von].name}
                    </strong>

                    <span>zahlt an</span>

                    <strong>
                        ${laufendeRunde
                            .spieler[zahlung.an].name}
                    </strong>

                    <b>
                        ${formatiereEuro(
                            zahlung.betrag
                        )}
                    </b>
                </li>
            `
        )
        .join("");
}

function erzeugeDreierAbrechnung(spielerwerte) {
    if (laufendeRunde.flightgroesse !== 3) {
        return "";
    }

    const cashflow =
        berechneDreierCashflow(spielerwerte);

    const cashflowZeilen =
        spielerwerte.map(
            (spieler, index) => `
                <div>
                    <dt>${spieler.name}</dt>

                    <dd>
                        ${formatiereEuro(
                            cashflow
                                .endgueltigeCashflows[index]
                        )}
                    </dd>
                </div>
            `
        )
        .join("");

    const zahlungsinhalt =
        cashflow.zahlungen.length > 0
            ? `
                <ul class="zahlungsliste">
                    ${erzeugeZahlungsliste(
                        cashflow.zahlungen
                    )}
                </ul>
            `
            : `
                <p>
                    Es sind keine Zahlungen erforderlich.
                </p>
            `;

    return `
        <section class="cashflow-bereich">
            <h2>Abrechnung</h2>

            <dl class="cashflow-uebersicht">
                ${cashflowZeilen}
            </dl>

            <h3>Zahlungen</h3>

            ${zahlungsinhalt}
        </section>
    `;
}

function erzeugeViererAbrechnung(teamwerte) {
    if (laufendeRunde.flightgroesse !== 4) {
        return "";
    }

    const cashflow =
        berechneViererCashflow(teamwerte);

    const ersterSiegerIndex =
        cashflow.siegerTeamIndex * 2;

    const siegerNamen = `
        ${laufendeRunde.spieler[ersterSiegerIndex].name}
        &amp;
        ${laufendeRunde.spieler[ersterSiegerIndex + 1].name}
    `;

    return `
        <section class="cashflow-bereich">
            <h2>Abrechnung</h2>

            <p class="siegeranzeige">
                Team ${cashflow.siegerTeamIndex + 1}
                (${siegerNamen}) gewinnt nach
                <strong>${cashflow.entscheidung}</strong>.
            </p>

            <dl class="cashflow-uebersicht">
                <div>
                    <dt>Lochpunktvorsprung</dt>
                    <dd>
                        ${cashflow.lochpunktVorsprung}
                    </dd>
                </div>

                <div>
                    <dt>Siegespunkt</dt>
                    <dd>+${cashflow.siegespunkt}</dd>
                </div>

                <div>
                    <dt>Sonderpunkte Sieger</dt>
                    <dd>
                        +${cashflow.sonderpunkteSieger}
                    </dd>
                </div>

                <div>
                    <dt>Sonderpunkte Gegner</dt>
                    <dd>
                        −${cashflow.sonderpunkteVerlierer}
                    </dd>
                </div>

                <div class="hervorgehoben">
                    <dt>Auszahlung je Paar</dt>
                    <dd>
                        ${formatiereEuro(
                            cashflow.auszahlung
                        )}
                    </dd>
                </div>
            </dl>

            <h3>Zahlungen</h3>

            <ul class="zahlungsliste">
                ${erzeugeZahlungsliste(
                    cashflow.zahlungen
                )}
            </ul>
        </section>
    `;
}

function berechneScorekartenSumme(
    lochnummern,
    spielerIndex
) {
    return lochnummern.reduce(
        (summe, lochnummer) =>
            summe
            + laufendeRunde
                .ergebnisse[lochnummer]
                .spieler[spielerIndex]
                .schlaege,
        0
    );
}

function erzeugeSonderpunktKuerzel(
    ergebnis,
    loch,
    istNeary
) {
    let kuerzel = "";

    if (ergebnis.sandy) {
        kuerzel += "S";
    }

    if (istNeary) {
        kuerzel += "N";
    }

    if (ergebnis.schlaege === loch.par - 1) {
        kuerzel += "B";
    }

    if (ergebnis.schlaege <= loch.par - 2) {
        kuerzel += "E";
    }

    if (kuerzel === "") {
        return "";
    }

    return `
        <small class="sonderpunkt-kuerzel">
            (${kuerzel})
        </small>
    `;
}

function erzeugeScorekartenLochzeilen(lochnummern) {
    return lochnummern
        .map(
            (lochnummer) => {
                const loch = findeLoch(lochnummer);
                const lochergebnis =
                    laufendeRunde.ergebnisse[lochnummer];

                const scores = laufendeRunde.spieler
                    .map(
                        (_, spielerIndex) => {
                            const ergebnis =
                                lochergebnis
                                    .spieler[spielerIndex];

                            const istNeary =
                                lochergebnis
                                    .nearySpielerIndex
                                === spielerIndex;

                            return `
                                <td>
                                    <span class="scorekarten-wert">
                                        ${ergebnis.schlaege}
                                        ${erzeugeSonderpunktKuerzel(
                                            ergebnis,
                                            loch,
                                            istNeary
                                        )}
                                    </span>
                                </td>
                            `;
                        }
                    )
                    .join("");

                return `
                    <tr>
                        <th scope="row">${loch.nummer}</th>
                        <td>${loch.par}</td>
                        <td>${loch.hcp}</td>
                        ${scores}
                    </tr>
                `;
            }
        )
        .join("");
}

function erzeugeScorekartenZwischensumme(
    beschriftung,
    lochnummern
) {
    const parSumme = lochnummern.reduce(
        (summe, lochnummer) =>
            summe + findeLoch(lochnummer).par,
        0
    );

    const spielerSummen = laufendeRunde.spieler
        .map(
            (_, spielerIndex) => `
                <td>
                    ${berechneScorekartenSumme(
                        lochnummern,
                        spielerIndex
                    )}
                </td>
            `
        )
        .join("");

    return `
        <tr class="scorekarten-zwischensumme">
            <th scope="row">${beschriftung}</th>
            <td>${parSumme}</td>
            <td>–</td>
            ${spielerSummen}
        </tr>
    `;
}

function erzeugeScorekartenGesamtsumme(
    beschriftung,
    werte
) {
    const wertZellen = werte
        .map(
            (wert) => `<td>${wert}</td>`
        )
        .join("");

    return `
        <tr class="scorekarten-gesamtsumme">
            <th scope="row" colspan="3">
                ${beschriftung}
            </th>
            ${wertZellen}
        </tr>
    `;
}

function zeigeScorekarte() {
    const frontNeun = [
        1, 2, 3, 4, 5, 6, 7, 8, 9,
    ];

    const backNeun = [
        10, 11, 12, 13, 14, 15, 16, 17, 18,
    ];

    const alleLoecher = [
        ...frontNeun,
        ...backNeun,
    ];

    const bruttoSummen = laufendeRunde.spieler
        .map(
            (_, spielerIndex) =>
                berechneScorekartenSumme(
                    alleLoecher,
                    spielerIndex
                )
        );

    const nettoSummen = bruttoSummen.map(
        (brutto, spielerIndex) =>
            brutto
            - laufendeRunde
                .spieler[spielerIndex]
                .platzvorgabe
    );

    const kopfSpieler = laufendeRunde.spieler
        .map(
            (spieler) => `
                <th scope="col" class="spieler-spalte">
                    ${spieler.name}
                </th>
            `
        )
        .join("");

    startkarte.innerHTML = `
        <div class="loch-kopf">
            <span>Runde abgeschlossen</span>
            <h2>Scorekarte</h2>
        </div>

        <section class="scorekarten-tabelle-bereich">
            <table class="scorekarten-tabelle">
                <thead>
                    <tr>
                        <th scope="col">Bahn</th>
                        <th scope="col">Par</th>
                        <th scope="col">HCP</th>
                        ${kopfSpieler}
                    </tr>
                </thead>

                <tbody>
                    ${erzeugeScorekartenLochzeilen(
                        frontNeun
                    )}

                    ${erzeugeScorekartenZwischensumme(
                        "1–9",
                        frontNeun
                    )}

                    ${erzeugeScorekartenLochzeilen(
                        backNeun
                    )}

                    ${erzeugeScorekartenZwischensumme(
                        "10–18",
                        backNeun
                    )}

                    ${erzeugeScorekartenGesamtsumme(
                        "Brutto",
                        bruttoSummen
                    )}

                    ${erzeugeScorekartenGesamtsumme(
                        "Netto",
                        nettoSummen
                    )}
                </tbody>
            </table>
        </section>

        <p class="scorekarten-legende">
            <span>(S) Sandy</span>
            <span>(N) Neary</span>
            <span>(B) Birdie</span>
            <span>(E) Eagle oder besser</span>
        </p>

        <button
            id="zurueck-zur-auswertung-button"
            class="primary-button"
            type="button"
        >
            Zurück zur Auswertung
        </button>
    `;

    document
        .querySelector("#zurueck-zur-auswertung-button")
        .addEventListener(
            "click",
            zeigeEndauswertung
        );
}

function zeigeEndauswertung() {
    const auswertung =
        berechneRundenauswertung();

    startkarte.innerHTML = `
        <div class="loch-kopf">
            <span>Runde abgeschlossen</span>
            <h2>Gesamtergebnis</h2>
        </div>

        <div class="endkarten">
            ${erzeugeSpielerEndkarten(
                auswertung.spielerwerte
            )}
        </div>

        ${erzeugeTeamEndkarten(
            auswertung.teamwerte
        )}

        ${erzeugeDreierAbrechnung(
            auswertung.spielerwerte
        )}

        ${erzeugeViererAbrechnung(
            auswertung.teamwerte
        )}

        <button
            id="scorekarte-anzeigen-button"
            class="secondary-button"
            type="button"
        >
            Scorekarte anzeigen
        </button>

        <div class="end-navigation">
            <button
                id="zurueck-zur-runde-button"
                class="secondary-button"
                type="button"
            >
                Zurück zur letzten Bahn
            </button>

            <button
                id="runde-loeschen-button"
                class="primary-button"
                type="button"
            >
                Runde beenden und löschen
            </button>
        </div>
    `;

    document
        .querySelector("#scorekarte-anzeigen-button")
        .addEventListener(
            "click",
            zeigeScorekarte
        );

    document
        .querySelector("#zurueck-zur-runde-button")
        .addEventListener(
            "click",
            zeigeLochmaske
        );

    document
        .querySelector("#runde-loeschen-button")
        .addEventListener(
            "click",
            loescheAbgeschlosseneRunde
        );
}

function loescheAbgeschlosseneRunde() {
    const bestaetigt = window.confirm(
        "Möchtest du die Runde wirklich löschen?"
    );

    if (!bestaetigt) {
        return;
    }

    localStorage.removeItem(SPEICHERSCHLUESSEL);
    laufendeRunde = null;

    rundeneinstellungen = {
        flightgroesse: 3,
        startloch: 1,
        spieler: [],
    };

    zeigeStartbildschirm();
}
