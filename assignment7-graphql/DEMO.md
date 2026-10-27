# CampusEats GraphQL Service — Video Demonstration Script (1–2 Minutes)

This guide provides the exact script and step-by-step demonstration sequence to record your 1–2 minute video for **Assignment 7: Build one CampusEats service in GraphQL**.

---

## Prerequisites Before Recording
1. **Ensure MySQL is running** on `localhost:3306`.
2. **Terminal 1** open in `assignment7-graphql/`.
3. **Web Browser** ready to open `http://localhost:4000/`.
4. **Screen recorder** active (e.g., OBS Studio, Loom, or Windows Xbox Game Bar `Win + Alt + R`).

---

## Step-by-Step Recording Sequence

### Step 1: Initialize / Reset Database (0:00 – 0:15)
In Terminal, show that the database has 4 initial seed records:
```bash
# In assignment7-graphql directory
mysql -u root -e "USE campuseats_graphql; SELECT * FROM dishes;"
```
*Voiceover / Note:*
> "Here is our MySQL database `campuseats_graphql` with the dishes table holding our 4 initial seed records: Paneer Roll, Veg Sandwich, Masala Dosa, and Cold Coffee."

---

### Step 2: Start the Apollo GraphQL Server (0:15 – 0:30)
In Terminal, start the server:
```bash
npm start
```
Point to the startup logs:
- `✅ Connected to MySQL database successfully.`
- `🚀 CampusEats GraphQL Service is running!`
- `🌐 Frontend Application: http://localhost:4000/`
- `📊 GraphQL Endpoint: http://localhost:4000/graphql`

*Voiceover / Note:*
> "We launch our Apollo Server 4 integrated with Express and MySQL. It confirms a successful MySQL connection and serves both our GraphQL endpoint at `/graphql` and the static CampusEats frontend at `/`."

---

### Step 3: Open the Frontend Application (0:30 – 0:50)
1. Open your browser and navigate to:
   ```
   http://localhost:4000/
   ```
2. Point out:
   - The **CampusEats Menu** showing the **4 seed dishes** loaded dynamically via GraphQL `dishes` query.
   - The prices in Indian Rupees (`₹90.00`, `₹60.00`, `₹80.00`, `₹50.00`).
   - The availability badges (Paneer Roll: Available, Cold Coffee: Unavailable).
   - The counter showing `4 items`.

*Voiceover / Note:*
> "When the page loads, a vanilla JavaScript `fetch()` sends a GraphQL `query { dishes { id name price available } }` to `/graphql`. The 4 dishes from MySQL are rendered dynamically."

---

### Step 4: Fire the `addDish` Mutation (0:50 – 1:20)
1. In the **Add New Dish** form on the right:
   - **Dish Name:** `Chole Bhature`
   - **Price (₹):** `110`
   - **Available:** Check the box
2. Click **"Add Dish to Menu"**.
3. Point out:
   - The button shows "Adding Dish..." while the request is in flight.
   - The green alert banner appears: `✅ Dish "Chole Bhature" (ID #5) added to menu successfully at ₹110.00!`
   - The menu updates immediately to `5 items`.
   - The new card `#5 Chole Bhature` appears with price `₹110.00` and `Available` badge.
   - The form resets automatically.

*Voiceover / Note:*
> "We submit the form, which executes the `addDish` GraphQL mutation. The server executes a parameterized SQL INSERT, fetches the newly created record from MySQL, and returns it. The frontend updates dynamically without a page reload."

---

### Step 5: Verify Persistence in MySQL (1:20 – 1:40)
Switch back to terminal or MySQL workbench and run:
```bash
mysql -u root -e "USE campuseats_graphql; SELECT * FROM dishes;"
```
Show row 5:
```
5 | Chole Bhature | 110.00 | 1
```

*Voiceover / Note:*
> "Querying MySQL directly proves that the record was genuinely persisted in the database with an auto-incremented primary key, rather than just simulated in memory."

---

## Submission Checklist
- [ ] Upload recording to Google Drive.
- [ ] Set link sharing to **"Anyone with the link can view"**.
- [ ] Paste the Google Drive link into `assignment7-graphql/README.md`.
- [ ] Ensure before-mutation and after-mutation screenshots are present in `assignment7-graphql/screenshots/`.
