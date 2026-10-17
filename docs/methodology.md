# QuakeScope: Distributed Seismic Analysis & Earthquake Pattern Classification

## Stage 1 — Core Processing & MLlib Engine Methodology

**Course**: INT315 — Cluster Computing (Continuous Assessment 2 — CA2)  
**Implementation**: Scala 2.12.18, Apache Spark 3.5.6 (Spark Core, Spark SQL, Spark MLlib), sbt 1.9.9  
**Execution Environment**: Windows 11 with WSL2 Ubuntu (OpenJDK 1.8.0_504)  
**Dataset**: USGS Global Earthquake Catalog (2025-01-01 to 2026-01-01)  

---

## 1. Project Title & Problem Statement

### Title
**QuakeScope: Distributed Seismic Analysis and Earthquake Pattern Classification Using Scala and Apache Spark**

### Problem Statement
Global seismic activity generates vast streams of geophysical telemetry from thousands of seismic observation stations worldwide. Understanding spatial clustering, depth distributions, and seismic energy release is essential for hazard awareness and disaster preparedness. However, raw seismic catalogs contain non-earthquake events (e.g., quarry/mining blasts, landslides), incomplete station telemetry, and high-frequency noise. 

Traditional single-node data processing tools (e.g., standard pandas or spreadsheets) face scalability bottlenecks when processing millions of historical records or computing complex windowed aggregations across geographical zones. **QuakeScope** leverages Apache Spark's distributed computing paradigm in Scala to ingest, assess, clean, engineer features, analyze via Spark SQL, and classify seismic patterns using Spark MLlib with complete reproducibility.

---

## 2. Project Objectives

1. **Distributed Data Ingestion & Quality Profiling**: Ingest real-world USGS seismic records into a distributed Spark DataFrame with automatic schema inference and systematic null/outlier auditing.
2. **Defensible, Documented Data Cleaning**: Apply physically grounded seismological filtering rules with exact mathematical reconciliation (zero unaccounted rows).
3. **Seismic Feature Engineering**: Derive temporal partitions, standardized magnitude classes, hypocenter depth zones, and geographical region identifiers.
4. **Spark Core & Spark SQL Analytics**: Compute comprehensive statistical profiles, monthly activity progressions, regional depth dynamics, and Spark window-function rankings.
5. **Supervised ML Pattern Classification**: Implement a leakage-free Spark MLlib `DecisionTreeClassifier` to classify magnitude tiers from hypocenter coordinates and depth, evaluated on a held-out test split with multiclass metrics.
6. **Decoupled Asset Generation**: Export clean, structured static JSON and CSV analytical assets for downstream dashboard visualization (Stage 2/3).

---

## 3. Dataset Description & Provenance

* **Source**: United States Geological Survey (USGS) Earthquake Hazards Program
* **Catalog URL**: [USGS Earthquake Catalog Search](https://earthquake.usgs.gov/earthquakes/search/)
* **Query Parameters**: Global coverage, minimum magnitude $M \ge 3.5$, date range `2025-01-01T00:00:00.000Z` to `2026-01-01T23:59:59.999Z`.
* **File Name & Location**: `query.csv` at `/mnt/c/QuakeScope/query.csv` (`C:\QuakeScope\query.csv`).
* **Original Record Count**: 19,705 data records (19,706 lines including header).
* **Dimensionality**: 22 geophysical and metadata fields.

### Dataset Schema & Attributes

| Field Name | Inferred Data Type | Seismological Description | Category |
| :--- | :--- | :--- | :--- |
| `time` | Timestamp / String | UTC event origin timestamp (ISO-8601 format) | Essential |
| `latitude` | Double | Epicenter latitude in decimal degrees [-90.0, 90.0] | Essential |
| `longitude` | Double | Epicenter longitude in decimal degrees [-180.0, 180.0] | Essential |
| `depth` | Double | Hypocenter depth in kilometers below sea level | Essential |
| `mag` | Double | Event magnitude on specified scale | Essential |
| `magType` | String | Magnitude calculation algorithm (`mb`, `mww`, `ml`, `mwr`, `md`, `mw`) | Descriptive |
| `nst` | Integer | Number of seismic stations reporting P and S arrivals | Quality (Optional) |
| `gap` | Double | Azimuthal gap between reporting stations (degrees) | Quality (Optional) |
| `dmin` | Double | Horizontal distance to the nearest station (degrees) | Quality (Optional) |
| `rms` | Double | Root-mean-square travel time residual (seconds) | Quality (Optional) |
| `net` | String | Network ID that contributed the data (e.g., `us`, `pt`) | Administrative |
| `id` | String | Unique USGS event identifier (e.g., `us6000qw60`) | Essential |
| `updated` | Timestamp / String | Timestamp of latest event solution update | Administrative |
| `place` | String | Descriptive location string (e.g., "140 km E of Petropavlovsk-Kamchatsky, Russia") | Descriptive |
| `type` | String | Type of seismic event (`earthquake`, `mining explosion`, `landslide`) | Essential |
| `horizontalError` | Double | Uncertainty of epicenter location (km) | Quality (Optional) |
| `depthError` | Double | Uncertainty of hypocenter depth (km) | Quality (Optional) |
| `magError` | Double | Uncertainty of reported magnitude | Quality (Optional) |
| `magNst` | Integer | Number of stations used to calculate magnitude | Quality (Optional) |
| `status` | String | Review status (`reviewed` vs `automatic`) | Administrative |
| `locationSource` | String | Agency network that located the epicenter | Administrative |
| `magSource` | String | Agency network that calculated magnitude | Administrative |

---

## 4. Hardware & Software Technology Stack

* **Operating System**: Windows 11 Professional (Host) with WSL2 Ubuntu 24.04 LTS (Guest)
* **Java Virtual Machine**: OpenJDK 1.8.0_504 64-Bit Server VM (`/usr/lib/jvm/java-8-openjdk-amd64`)
* **Scala**: Version 2.12.18
* **Apache Spark**: Version 3.5.6 (pre-built with Apache Hadoop 3.3.6)
* **Build Tool**: sbt 1.9.9 (Simple Build Tool)
* **Execution Engine**: Local cluster mode (`local[*]`) leveraging all CPU execution cores with 2GB driver memory and 4 shuffle partitions.

---

## 5. Architectural Pipeline & Workflow

```
[query.csv (USGS Raw)] 
         │
         ▼
[Stage 1: Ingestion & Environment Profiling]
         │ (19,705 raw records, 22 columns)
         ▼
[Stage 2: Data Quality Assessment]
         │ (Audit missing values, coordinates, duplicate IDs, event types)
         ▼
[Stage 3: Data Cleaning & Reconciliation]
         ├─ Deduplicate event ID (0 removed)
         ├─ Subsurface depth >= 0.0 km (1 rejected: uu80122716 @ -2.39 km)
         ├─ Retain type == 'earthquake' (16 non-earthquakes excluded)
         └─ Preserve 268 records with missing optional error metrics
         │ (19,688 Cleaned Earthquakes Reconciled: 100%)
         ▼
[Stage 4: Feature Engineering]
         ├─ Temporal decomposition (year, month, day, hour, day_of_week)
         ├─ Magnitude Category (Minor, Light, Moderate, Strong, Major)
         ├─ Depth Category (Shallow [0-70km], Intermediate [70-300km], Deep [>300km])
         ├─ Primary Geographical Region (parsed from place)
         └─ MLlib Balanced Target Label (mag_class_mllib)
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
[Stage 5 & 6: Analytics & Window Functions]   [Stage 7: Spark MLlib Engine]
   ├─ Descriptive KPIs & Distributions           ├─ Leakage-Free Assembler (lat, lon, depth)
   ├─ Monthly Trends (Endpoint handled)          ├─ StringIndexer (Target)
   ├─ Spark SQL TempView Analytics               ├─ Deterministic 80/20 Train/Test Split
   └─ Regional Top-3 Window Rankings             ├─ DecisionTreeClassifier (maxDepth=5)
                                                 └─ Multiclass Metrics & Confusion Matrix
         │                                         │
         └────────────────────┬────────────────────┘
                              ▼
               [Stage 8: Export & Asset Validation]
                  ├─ output/dashboard/*.json (8 assets)
                  ├─ output/dashboard/*.csv  (5 assets)
                  └─ output/quakescope_execution.log
```

---

## 6. Data Cleaning & Reconciliation Methodology

### Cleaning Rules
1. **Event Deduplication**: Every event must possess a unique USGS identifier (`id`). Any duplicates are dropped using `.dropDuplicates("id")`. In the 2025 dataset, **0 duplicates** were detected.
2. **Subsurface Depth Physicality**: In subsurface seismology, hypocenter depth must be non-negative ($\ge 0.0\text{ km}$). While USGS catalogs occasionally record negative depths for events calculated above sea level in elevated topography, these are physically unrepresentative of tectonic hypocenters. Exactly **1 record** (`id: uu80122716`, place: "4 km NW of Little America, Wyoming", depth: `-2.39 km`) was identified and rejected.
3. **Event Scope Isolation**: The project focuses strictly on natural tectonic and volcanic earthquakes. Non-earthquake anthropogenic or surface phenomena (**13 mining explosions, 2 landslides, 1 industrial explosion = 16 events**) were excluded.
4. **Coordinate Bounding Box Validation**: Latitude was validated within $[-90.0, 90.0]^\circ$ and longitude within $[-180.0, 180.0]^\circ$. All 19,705 records complied.
5. **Magnitude Plausibility**: Magnitude was validated within $[0.0, 10.0]$. All records complied.
6. **Optional Quality Preservation Policy**: Records missing optional station telemetry fields (`nst`, `gap`, `dmin`, `horizontalError`, `magError`, `magNst`) were deliberately **preserved** (**268 records, 1.36%**). Discarding them would introduce severe geographic sampling bias in remote oceanic and subduction zones where station coverage is sparse.

### Mathematical Reconciliation Table

$$\text{Original Ingested Rows} = \text{Duplicates Removed} + \text{Rejected Essential} + \text{Excluded Non-Target} + \text{Cleaned Retained Rows}$$

$$19,705 = 0 + 1 + 16 + 19,688$$

| Reconciliation Metric | Count | Percentage of Original | Action / Policy |
| :--- | :---: | :---: | :--- |
| **Original Ingested Rows** | **19,705** | **100.00%** | Ingested via Spark CSV reader with header & inferSchema |
| **Duplicates Removed** | 0 | 0.00% | Deduplicated by event `id` |
| **Rejected Essential Fields** | 1 | 0.01% | Rejected due to negative depth (`uu80122716`, depth = -2.39 km) |
| **Excluded Non-Earthquake Types**| 16 | 0.08% | Excluded 13 mining explosions, 2 landslides, 1 explosion |
| **Total Rows Excluded** | 17 | 0.09% | All rejection reasons explicitly accounted for |
| **Retained Cleaned Earthquakes** | **19,688** | **99.91%** | Core dataset for all analytics and modeling |
| *Preserved Missing Optional Fields* | *268* | *1.36%* | Safely preserved to maintain global geographic coverage |

---

## 7. Feature Engineering Methodology

Using Spark DataFrame transformations (`org.apache.spark.sql.functions._`), six key analytical dimensions were derived:

1. **Temporal Decompositions**:
   - `event_timestamp = to_timestamp(col("time"))`
   - `event_date = to_date(col("event_timestamp"))`
   - `year_month = date_format(col("event_timestamp"), "yyyy-MM")`
   - `hour_of_day = hour(col("event_timestamp"))`
   - `day_of_week = date_format(col("event_timestamp"), "EEEE")`

2. **Magnitude Classification (`magnitude_category`)**:
   - Standard USGS descriptive categories:
     - **Minor (3.5–3.9)**: $3.5 \le M < 4.0$ (1,345 records, 6.83%)
     - **Light (4.0–4.9)**: $4.0 \le M < 5.0$ (16,207 records, 82.32%)
     - **Moderate (5.0–5.9)**: $5.0 \le M < 6.0$ (1,990 records, 10.11%)
     - **Strong (6.0–6.9)**: $6.0 \le M < 7.0$ (130 records, 0.66%)
     - **Major ($\ge$ 7.0)**: $M \ge 7.0$ (16 records, 0.08%)

3. **Hypocenter Depth Classification (`depth_category`)**:
   - Seismological depth divisions:
     - **Shallow (0–70 km)**: 14,800 records (75.17%), avg depth 21.1 km. Crustal and subduction interface ruptures.
     - **Intermediate (70–300 km)**: 3,768 records (19.14%), avg depth 134.3 km. Wadati-Benioff subducting slab events.
     - **Deep (> 300 km)**: 1,120 records (5.69%), avg depth 511.96 km (max 669.56 km). Deep mantle slab phase transitions.

4. **Geographical Region Extraction (`primary_region`)**:
   - Extracted by isolating the trailing administrative entity from USGS `place` strings:
     `when(col("place").contains(", "), trim(element_at(split(col("place"), ", "), -1))).otherwise(trim(col("place")))`
   - Yields clean regional identifiers (e.g., "Russia", "Indonesia", "Japan", "Alaska", "Papua New Guinea", "Chile", "Tonga").

5. **MLlib Balanced Supervised Target (`mag_class_mllib`)**:
   - To avoid zero-instance class splits in cross-validation and test partitions:
     - `Minor`: $M < 4.0$
     - `Light`: $4.0 \le M < 5.0$
     - `Moderate_Plus`: $M \ge 5.0$ (merges Moderate, Strong, and Major)

---

## 8. Spark Core, DataFrame, & Spark SQL Analytics

### Analytical Findings

1. **Overall Descriptive KPIs**:
   - Total Cleaned Earthquakes: **19,688**
   - Magnitude Range: **3.50 to 8.80** (Mean: **4.456**, StdDev: **0.428**)
   - Depth Range: **0.00 km to 669.56 km** (Mean: **70.69 km**, StdDev: **121.81 km**)

2. **Temporal Trends & Single-Day Endpoint**:
   - Monthly seismic volume averaged ~1,400 to 1,500 events per month.
   - **Seismic Surge in July–August 2025**: July 2025 recorded **2,838 events** and August recorded **2,329 events**, triggered by the massive $M 8.8$ Kamchatka megathrust event on July 29, 2025, and subsequent aftershock sequences.
   - **Endpoint Handling**: `2026-01` contains **51 events** representing exactly one calendar day (January 1, 2026). It is explicitly designated in the exports as an endpoint rather than a full calendar month.

3. **Top 5 Global Seismic Hotspots**:
   1. **Russia**: 4,091 events (20.78% of global activity) — dominated by the Kamchatka-Kuril subduction zone.
   2. **Indonesia**: 1,432 events (7.27%) — Sunda and Banda arcs.
   3. **Japan**: 1,076 events (5.47%) — Japan Trench and Nankai Trough.
   4. **Alaska**: 1,072 events (5.45%) — Aleutian megathrust.
   5. **Papua New Guinea**: 866 events (4.40%) — Bismarck Sea plate boundaries.

4. **The Strongest Global Earthquakes Recorded (2025–2026)**:
   1. **M 8.8** — `us6000qw60` (2025-07-29, 35.0 km depth): 2025 Kamchatka Peninsula, Russia Earthquake
   2. **M 7.8** — `us7000qx2g` (2025-09-18, 27.0 km depth): 140 km E of Petropavlovsk-Kamchatsky, Russia
   3. **M 7.7** — `us7000pn9s` (2025-03-28, 10.0 km depth): 2025 Mandalay, Burma (Myanmar) Earthquake
   4. **M 7.6** — `us6000rgf4` (2025-10-10, 5.6 km depth): Drake Passage
   5. **M 7.6** — `us7000pcdl` (2025-02-08, 14.3 km depth): 210 km SSW of George Town, Cayman Islands
   6. **M 7.6** — `us6000rtdt` (2025-12-08, 40.7 km depth): 2025 Aomori Prefecture, Japan Earthquake

### Spark Window Function Ranking

To rank the strongest seismic events within regional clusters without performing expensive self-joins, Spark's window specification was applied:

```scala
val regionalWindow = Window.partitionBy("primary_region").orderBy(col("mag").desc, col("depth").asc)

val rankedRegionalDF = featuredDF
  .filter(col("primary_region").isin(top5RegionList: _*))
  .withColumn("regional_rank", dense_rank().over(regionalWindow))
  .filter(col("regional_rank") <= 3)
```

This partitioned the distributed dataset by `primary_region`, sorted each partition locally by magnitude descending, and assigned a `dense_rank()`, providing the top 3 strongest events for each major seismic zone.

---

## 9. Spark MLlib Supervised Classification Module

### Objective
Demonstrate an end-to-end, reproducible distributed machine-learning pipeline using Spark MLlib (`org.apache.spark.ml`). The objective is **pattern classification of historical seismic clusters**, not future earthquake prediction.

### Model Formulation, Split Policy & Leakage Prevention
* **Algorithm**: `DecisionTreeClassifier` (multiclass, optimized `maxDepth = 7`).
* **Target Label**: `mag_class_mllib` (`Light` [Index 0], `Moderate_Plus` [Index 1], `Minor` [Index 2]).
* **Input Features**: `latitude`, `longitude`, `depth` (assembled via `VectorAssembler`).
* **Feature Exclusion & Leakage Prevention**: `mag`, `magType`, station counts, error margins, and timestamps were strictly excluded. Only fundamental spatial coordinates were provided.
* **Partitioning & Preprocessing Policy**: Dataset was split into **80% Train (15,861 records)** and **20% Test (3,827 records)** using fixed seed `42L` **BEFORE** fitting any transformer. `StringIndexer` was fit strictly on training data with `setHandleInvalid("skip")` to eliminate preprocessing leakage.
* **Hyperparameter Validation Tuning**: Internal validation tuning on training partition compared `maxDepth` values of 3, 5, and 7:
  - `maxDepth = 3`: Validation F1 = 0.7950
  - `maxDepth = 5`: Validation F1 = 0.7993
  - `maxDepth = 7`: Validation F1 = 0.8018 (Selected)
* **Final Model Fitting**: Final `DecisionTreeClassifier` with `maxDepth = 7` fit on full training dataset, evaluated strictly on held-out test split.

### Empirical Evaluation Metrics (Held-Out Test Partition)

$$\text{Accuracy} = \frac{\sum \text{True Positives}}{\text{Total Test Instances}} = \frac{3084 + 7 + 203}{3827} = 0.8607\ (86.07\%)$$

| Metric | Empirical Score | Seismological & Technical Interpretation |
| :--- | :---: | :--- |
| **Test Accuracy** | **86.07%** | Overall correct multiclass prediction rate |
| **Majority-Class Baseline** | **83.15%** | Performance of a dummy classifier always predicting majority class (`Light`) |
| **Balanced Accuracy** | **62.04%** | Unweighted mean of recall across all three classes (penalizes majority bias) |
| **Weighted Precision** | **0.8338** | Class-support weighted precision |
| **Weighted Recall** | **0.8607** | Class-support weighted recall |
| **Weighted F1-Score** | **0.8157** | Class-support weighted harmonic mean |
| **Macro-Averaged F1** | **0.5702** | Unweighted mean of per-class F1 scores (robust indicator of minority performance) |

### Multiclass Confusion Matrix (Held-Out Test Set)

$$\begin{pmatrix}
\text{Actual Light} & 3,084 & 4 & 94 \\
\text{Actual Moderate\_Plus} & 398 & 7 & 8 \\
\text{Actual Minor} & 28 & 1 & 203
\end{pmatrix}$$

* Rows represent actual class labels; columns represent model predictions.
* **Light ($M 4.0–4.9$)**: 3,084 correctly classified, precision = 87.86%, recall = 96.92%, F1 = 0.9217.
* **Minor ($M < 4.0$)**: 203 correctly classified, precision = 66.56%, recall = 87.50%, F1 = 0.7561.
* **Moderate_Plus ($M \ge 5.0$)**: 7 correctly classified, 398 misclassified into dominant Light class, precision = 58.33%, recall = 1.69%, F1 = 0.0329.

### Scientific Discussion of Limitations
1. **Catalog Imbalance & Gutenberg-Richter Law**: The global earthquake catalog naturally exhibits power-law scaling ($b \approx 1$), meaning smaller earthquakes vastly outnumber larger ones. Light earthquakes constitute 83.15% of the test set. The majority baseline alone achieves 83.15%, illustrating why overall accuracy is deceptive for imbalanced scientific telemetry.
2. **Physical Independence of Magnitude**: In physics, earthquake magnitude is governed by dynamic fault rupture surface area and stress drop ($M_0 = \mu A D$), which cannot be determined solely from static hypocenter coordinates and depth. Spatial coordinates locate tectonic boundaries, but do not indicate how large an imminent rupture will be.
3. **No Predictive Claim**: This model demonstrates distributed pattern classification of spatial clusters; it does **not** predict future earthquakes or temporal recurrence intervals.

---

## 10. Execution Commands & Reproducibility Guide

### Step 1: Navigate to Project Root in WSL
```bash
cd /mnt/c/QuakeScope
```

### Step 2: Build Application JAR via sbt
```bash
sbt compile
sbt package
```
*Expected artifact*: `target/scala-2.12/quakescope_2.12-1.0.jar`

### Step 3: Execute Spark Engine with Tee Logging
```bash
mkdir -p output/dashboard screenshots
spark-submit \
  --class quakescope.QuakeScope \
  --master "local[*]" \
  --driver-memory 2g \
  target/scala-2.12/quakescope_2.12-1.0.jar \
  /mnt/c/QuakeScope/query.csv 2>&1 | tee output/quakescope_execution.log
```

---

## 11. Exported Dashboard Static Assets (`output/dashboard/`)

| Filename | Format | Description | Primary Fields |
| :--- | :---: | :--- | :--- |
| `kpis_and_cleaning.json` | JSON | Overall KPIs, reconciliation balance, environment metadata | `total_events`, `avg_magnitude`, `avg_depth_km`, `cleaning_reconciliation` |
| `monthly_trends.json` | JSON | Monthly event counts, average/max magnitude, endpoint note | `year_month`, `event_count`, `avg_mag`, `max_mag`, `period_note` |
| `monthly_trends.csv` | CSV | Tabular monthly progression for charting | `year_month,event_count,avg_mag,max_mag,avg_depth_km,period_note` |
| `magnitude_distribution.json`| JSON | Event counts and proportions across magnitude tiers | `category`, `count`, `percentage`, `avg_mag`, `avg_depth` |
| `magnitude_distribution.csv` | CSV | Tabular magnitude category distribution | `category,count,percentage,avg_mag,avg_depth` |
| `depth_distribution.json` | JSON | Event counts across Shallow, Intermediate, Deep zones | `category`, `count`, `percentage`, `min_depth_km`, `avg_depth_km` |
| `depth_distribution.csv` | CSV | Tabular depth zone distribution | `category,count,percentage,min_depth_km,max_depth_km,avg_depth_km` |
| `top_regions.json` | JSON | Top global seismic zones ranked by frequency | `region`, `event_count`, `pct_of_global`, `avg_mag`, `max_mag` |
| `top_regions.csv` | CSV | Tabular regional seismic distribution | `region,event_count,pct_of_global,avg_mag,max_mag,avg_depth_km` |
| `strongest_events.json` | JSON | Top 10 strongest earthquakes recorded globally | `id`, `event_date`, `time`, `mag`, `depth`, `region`, `place` |
| `strongest_events.csv` | CSV | Tabular strongest earthquakes | `id,event_date,time,mag,magType,depth,region,place` |
| `hourly_distribution.json` | JSON | Diurnal 24-hour UTC seismic occurrence distribution | `hour_utc`, `event_count`, `avg_mag` |
| `mllib_metrics.json` | JSON | Model hyperparameters, test metrics, confusion matrix | `accuracy`, `weighted_f1_score`, `class_metrics`, `confusion_matrix` |

---

## 12. Screenshot Checklist for CA2 Final Report

The following terminal captures are designated for the final CA2 submission document:

| # | Screenshot Filename | Exact Command Executed | Terminal Output Captured |
| :-: | :--- | :--- | :--- |
| **1** | `01_wsl_environment.png` | `java -version; sbt --version; spark-submit --version; ls -lh query.csv` | Environment checks: Java 8, sbt 1.9.9, Spark 3.5.6, query.csv |
| **2** | `02_sbt_build_package.png` | `sbt clean compile package` & `ls -lh target/scala-2.12/quakescope_2.12-1.0.jar` | sbt compiling and packaging application JAR (26 KB) |
| **3** | `03_dataset_ingestion.png` | `spark-submit --class quakescope.QuakeScope ... query.csv` | `[1/8]` Ingestion: 19,705 raw records, 22 columns, sample rows |
| **4** | `04_data_quality_audit.png` | *(pipeline output stream)* | `[2/8]` Quality Audit: missing values table, 0 duplicate IDs, event types |
| **5** | `05_cleaning_reconciliation.png` | *(pipeline output stream)* | `[3/8]` Cleaning: excluded event `uu80122716`, Reconciliation Table |
| **6** | `06_feature_engineering.png` | *(pipeline output stream)* | `[4/8]` Feature Engineering: engineered schema & 5 sample rows |
| **7** | `07_spark_sql_analytics.png` | *(pipeline output stream)* | `[5/8]` Spark SQL Analytics: KPIs, magnitude table, monthly trends |
| **8** | `08_window_ranking.png` | *(pipeline output stream)* | `[6/8]` Window Function: regional top 3 strongest quakes table |
| **9** | `09_mllib_evaluation.png` | *(pipeline output stream)* | `[7/8]` MLlib: DecisionTree accuracy (85.63%), F1, confusion matrix |
| **10**| `10_export_validation.png` | `ls -lh output/dashboard/` | `[8/8]` Export validation, success banner & file listing on disk |
