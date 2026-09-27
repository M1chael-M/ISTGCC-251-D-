# Orar Construcții — Anul II

Platformă web statică pentru orarul Anului II (a.u. 2026–2027, semestrul de toamnă), Facultatea de Construcții și Geodezie — UTM.

## Ce face

- Alegi grupa din listă (CIC, IMC, IGC, EDI, IAPC, CFDP, ISTGCC…)
- Vezi orarul pe toată săptămâna
- Filtrezi săptămâna **impară / pară / toate**
- Grupa aleasă se salvează în browser (`localStorage`) și se reîncarcă automat

## Publicare pe GitHub Pages

1. Creează un repository nou pe GitHub (ex. `orar-cfdp`).
2. Încarcă fișierele din acest folder (minim: `index.html`, `styles.css`, `app.js`, `data.js`).
3. În repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` (sau `master`), folder: `/ (root)`
4. Salvează. Site-ul va fi la:
   `https://<user>.github.io/<repo>/`

### Dacă repo-ul se numește `<user>.github.io`

Fișierele trebuie puse în rădăcina acelui repo; site-ul e direct pe `https://<user>.github.io/`.

## Rulare locală

Deschide `index.html` în browser, sau din folder:

```bash
npx --yes serve .
```

## Fișiere

| Fișier | Rol |
|--------|-----|
| `index.html` | Structura paginii |
| `styles.css` | Design (stil construcții) |
| `app.js` | Selectare grupă, filtrare, memorare |
| `data.js` | Datele orarului |
| `Orar anul II zi CFDP.pdf` | Sursa oficială (nu e necesară pe Pages) |

## Notă

Orarul CFDP-251 a fost verificat atent pe PDF. Pentru celelalte grupe, datele sunt extrase din același PDF; dacă vezi o nepotrivire, compară cu PDF-ul oficial.
