package quakescope

import org.apache.spark.sql.{SparkSession, DataFrame, Row}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._
import org.apache.spark.sql.expressions.Window
import org.apache.spark.ml.classification.{DecisionTreeClassifier, DecisionTreeClassificationModel}
import org.apache.spark.ml.feature.{StringIndexer, VectorAssembler}
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.mllib.evaluation.MulticlassMetrics

import java.io.{File, PrintWriter, FileWriter}
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import com.fasterxml.jackson.databind.ObjectMapper

object QuakeScope {

  def main(args: Array[String]): Unit = {
    val startTime = System.currentTimeMillis()
    var currentStage = "INITIALIZATION"

    println("=" * 80)
    println("  QUAKESCOPE: DISTRIBUTED SEISMIC ANALYSIS & EARTHQUAKE PATTERN CLASSIFIER")
    println("  Stage 1.1 — Corrected & Audited Spark Core, Spark SQL, & MLlib Engine (Scala)")
    println("  INT315 — Cluster Computing CA2 Submission")
    println("=" * 80)

    // Initialize Spark Session in local development mode
    val spark = SparkSession.builder()
      .appName("QuakeScope-SeismicEngine")
      .master("local[*]") // Local cluster mode: utilizes all CPU logical cores
      .config("spark.driver.memory", "2g")
      .config("spark.sql.shuffle.partitions", "4")
      .config("spark.ui.enabled", "false")
      .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")
    import spark.implicits._

    try {
      // Resolve dataset path (WSL default or provided argument)
      val defaultPath = "/mnt/c/QuakeScope/query.csv"
      val dataPath = if (args.length > 0) args(0) else defaultPath
      val dataFile = new File(dataPath)

      // =========================================================================
      // [1/8] STAGE A — ENVIRONMENT AND DATA INGESTION
      // =========================================================================
      currentStage = "[1/8] ENVIRONMENT AND DATA INGESTION"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)
      println(f"  Spark Version       : ${spark.version}")
      println(f"  Scala Version       : ${util.Properties.versionString}")
      println(f"  Java Runtime        : ${System.getProperty("java.version")} (${System.getProperty("java.vendor")})")
      println(f"  Spark Master        : ${spark.sparkContext.master} (Single-Node Local Engine; Scalable to Cluster)")
      println(f"  Execution Time      : ${LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))}")
      println(f"  Target Dataset Path : $dataPath")
      println(f"  File Exists         : ${dataFile.exists()}")
      println(f"  File Size           : ${dataFile.length() / (1024.0 * 1024.0)}%.2f MB (${dataFile.length()} bytes)")

      if (!dataFile.exists()) {
        throw new IllegalStateException(s"Dataset file not found at path: $dataPath")
      }

      println("\n--> Ingesting USGS Earthquake CSV with Schema Inference...")
      val rawDF = spark.read
        .option("header", "true")
        .option("inferSchema", "true")
        .csv(dataPath)
        .cache()

      val rawCount = rawDF.count()
      val rawColumns = rawDF.columns
      println(f"  Initial Ingested Record Count : $rawCount%,d")
      println(f"  Dataset Total Columns         : ${rawColumns.length}")

      println("\n--> Ingested Schema:")
      rawDF.printSchema()

      println("\n--> Sample Original Ingested Records (First 5 rows):")
      rawDF.select("time", "latitude", "longitude", "depth", "mag", "magType", "place", "type")
        .show(5, truncate = 50)

      // =========================================================================
      // [2/8] STAGE B — DATA QUALITY ASSESSMENT
      // =========================================================================
      currentStage = "[2/8] DATA QUALITY ASSESSMENT"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)

      println("--> Inspecting column-level null and missing counts across all 22 fields:")
      val nullCounts = rawColumns.map { colName =>
        val n = rawDF.filter(col(colName).isNull || col(colName) === "").count()
        val pct = (n.toDouble / rawCount) * 100.0
        (colName, n, pct)
      }

      println(f"  ${"Column Name"}%-20s | ${"Missing Count"}%14s | ${"Missing %"}%10s | ${"Category"}")
      println("-" * 70)
      nullCounts.foreach { case (cName, nCnt, nPct) =>
        val cat = if (Seq("id", "time", "latitude", "longitude", "depth", "mag").contains(cName)) "Essential"
                  else if (Seq("nst", "gap", "dmin", "horizontalError", "depthError", "magError", "magNst").contains(cName)) "Quality Measurement (Optional)"
                  else "Metadata / Administrative"
        println(f"  $cName%-20s | $nCnt%14d | $nPct%9.2f%% | $cat")
      }

      // Check duplicate IDs and exact duplicate rows
      val duplicateIdCount = rawDF.groupBy("id").count().filter(col("count") > 1).count()
      val distinctRowCount = rawDF.distinct().count()
      val exactDuplicateRows = rawCount - distinctRowCount

      println(f"\n  Duplicate Event IDs Found      : $duplicateIdCount%,d")
      println(f"  Exact Duplicate Records Found  : $exactDuplicateRows%,d")

      // Range and validity checks
      val invalidCoordinates = rawDF.filter(
        col("latitude").isNull || col("latitude") < -90.0 || col("latitude") > 90.0 ||
        col("longitude").isNull || col("longitude") < -180.0 || col("longitude") > 180.0
      ).count()

      val invalidMag = rawDF.filter(
        col("mag").isNull || col("mag") < 0.0 || col("mag") > 10.0
      ).count()

      val invalidDepth = rawDF.filter(
        col("depth").isNull || col("depth") < 0.0 || col("depth") > 1000.0
      ).count()

      println(f"  Records with Invalid Coordinates (Lat/Lon) : $invalidCoordinates%,d")
      println(f"  Records with Invalid Magnitude (Mag < 0)   : $invalidMag%,d")
      println(f"  Records with Physically Invalid Depth (<0) : $invalidDepth%,d")

      println("\n--> Distinct Seismic Event Types in Raw Dataset:")
      rawDF.groupBy("type").count().orderBy(col("count").desc)
        .withColumn("percentage", round((col("count") / rawCount) * 100.0, 2))
        .show(truncate = false)

      println("--> Distinct Magnitude Types (magType) in Raw Dataset (Top 10):")
      rawDF.groupBy("magType").count().orderBy(col("count").desc)
        .withColumn("percentage", round((col("count") / rawCount) * 100.0, 2))
        .show(10, truncate = false)

      // =========================================================================
      // [3/8] STAGE C — DATA CLEANING & RECONCILIATION
      // =========================================================================
      currentStage = "[3/8] DATA CLEANING & RECONCILIATION"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)
      println("Filtering Rules (Mutually Exclusive Audit Waterfall):")
      println("  1. Deterministic Deduplication: Retain record with latest 'updated' timestamp per 'id'.")
      println("  2. Essential Fields Check: 'id', 'time', 'latitude', 'longitude', 'depth', 'mag' must be non-null.")
      println("  3. Timestamp Format Validation: Must parse to valid ISO-8601 UTC timestamp.")
      println("  4. Coordinate Validation: Latitude in [-90, 90], Longitude in [-180, 180].")
      println("  5. Magnitude Plausibility: Magnitude in [0.0, 10.0].")
      println("  6. Subsurface Depth Constraint: Depth in [0.0, 1000.0] km (rejects subaerial quakes calculated above sea level).")
      println("  7. Event Scope Filter: Retain tectonic 'earthquake'; exclude explosions and landslides.")
      println("  8. Optional Telemetry Policy: Preserve records with missing station error metrics.")

      // 1. Deterministic Deduplication
      val dedupWindow = Window.partitionBy("id").orderBy(col("updated").desc_nulls_last, col("time").desc_nulls_last)
      val dedupDF = rawDF
        .withColumn("dup_rank", row_number().over(dedupWindow))
        .filter(col("dup_rank") === 1)
        .drop("dup_rank")
        .cache()

      val dedupCount = dedupDF.count()
      val duplicatesRemoved = rawCount - dedupCount

      // 2. Mutually Exclusive Audit Categorization on Deduplicated Data
      val categorizedDF = dedupDF.withColumn("audit_status",
        when(col("id").isNull || trim(col("id")) === "" ||
             col("time").isNull || trim(col("time")) === "" ||
             col("latitude").isNull || col("longitude").isNull ||
             col("depth").isNull || col("mag").isNull, "MISSING_ESSENTIAL")
        .when(to_timestamp(col("time")).isNull, "INVALID_TIMESTAMP")
        .when(col("latitude") < -90.0 || col("latitude") > 90.0 ||
              col("longitude") < -180.0 || col("longitude") > 180.0, "INVALID_COORDINATES")
        .when(col("mag") < 0.0 || col("mag") > 10.0, "INVALID_MAGNITUDE")
        .when(col("depth") < 0.0 || col("depth") > 1000.0, "INVALID_DEPTH")
        .when(lower(trim(col("type"))) =!= "earthquake", "NON_EARTHQUAKE_TYPE")
        .otherwise("RETAINED_CLEAN")
      ).cache()

      // Calculate exact counts for each mutually exclusive reason
      val missingEssentialCount = categorizedDF.filter(col("audit_status") === "MISSING_ESSENTIAL").count()
      val invalidTimestampCount = categorizedDF.filter(col("audit_status") === "INVALID_TIMESTAMP").count()
      val invalidCoordinatesCount = categorizedDF.filter(col("audit_status") === "INVALID_COORDINATES").count()
      val invalidMagnitudeCount = categorizedDF.filter(col("audit_status") === "INVALID_MAGNITUDE").count()
      val invalidDepthCount = categorizedDF.filter(col("audit_status") === "INVALID_DEPTH").count()
      val nonEarthquakeCount = categorizedDF.filter(col("audit_status") === "NON_EARTHQUAKE_TYPE").count()

      val totalExcluded = missingEssentialCount + invalidTimestampCount + invalidCoordinatesCount +
                            invalidMagnitudeCount + invalidDepthCount + nonEarthquakeCount

      val cleanedDF = categorizedDF.filter(col("audit_status") === "RETAINED_CLEAN").drop("audit_status").cache()
      val cleanedCount = cleanedDF.count()

      // Show details of excluded depth records if any
      if (invalidDepthCount > 0) {
        println(s"\n  [Excluded Event Details: Subsurface Depth < 0.0 km]")
        categorizedDF.filter(col("audit_status") === "INVALID_DEPTH")
          .select("id", "time", "latitude", "longitude", "depth", "mag", "place", "type")
          .show(truncate = false)
      }

      // Count records retaining missing optional fields
      val optionalCols = Seq("nst", "gap", "dmin", "horizontalError", "magError", "magNst")
      val missingOptCondition = optionalCols.map(c => col(c).isNull).reduce(_ || _)
      val retainedWithMissingOpt = cleanedDF.filter(missingOptCondition).count()

      // Print Reconciliation Table
      println("\n" + "=" * 75)
      println("  BEFORE-AND-AFTER DATA CLEANING RECONCILIATION TABLE")
      println("=" * 75)
      println(f"  Original Ingested Rows                 : $rawCount%,8d (100.00%%)")
      println(f"  [-] Duplicate Rows Removed             : $duplicatesRemoved%,8d (  ${(duplicatesRemoved.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [-] Missing Essential Fields           : $missingEssentialCount%,8d (  ${(missingEssentialCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [-] Invalid Timestamps                 : $invalidTimestampCount%,8d (  ${(invalidTimestampCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [-] Invalid Coordinates (Lat/Lon)      : $invalidCoordinatesCount%,8d (  ${(invalidCoordinatesCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [-] Invalid Magnitude (<0 or >10)      : $invalidMagnitudeCount%,8d (  ${(invalidMagnitudeCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [-] Physically Invalid Depth (<0 km)   : $invalidDepthCount%,8d (  ${(invalidDepthCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [-] Excluded Non-Earthquake Types      : $nonEarthquakeCount%,8d (  ${(nonEarthquakeCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  Total Excluded / Removed Rows          : ${duplicatesRemoved + totalExcluded}%,8d (  ${((duplicatesRemoved + totalExcluded).toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [=] Cleaned Retained Earthquake Events : $cleanedCount%,8d ( ${(cleanedCount.toDouble/rawCount)*100.0}%.2f%%)")
      println(f"  [i] Retained Records w/ Missing Opt.   : $retainedWithMissingOpt%,8d (  ${(retainedWithMissingOpt.toDouble/cleanedCount)*100.0}%.2f%%)")
      println("=" * 75)

      // Strict Mathematical Reconciliation Assertion
      val accountedTotal = duplicatesRemoved + totalExcluded + cleanedCount
      if (accountedTotal != rawCount) {
        throw new IllegalStateException(f"Reconciliation balance failure! Raw count ($rawCount%,d) does not match accounted total ($accountedTotal%,d)")
      }
      println(f"  [VERIFICATION] Reconciliation balances: $rawCount%,d = $duplicatesRemoved%,d duplicates + $totalExcluded%,d excluded + $cleanedCount%,d retained.\n")

      // =========================================================================
      // [4/8] STAGE D — FEATURE ENGINEERING
      // =========================================================================
      currentStage = "[4/8] FEATURE ENGINEERING"
      println("#" * 80)
      println(s"$currentStage")
      println("#" * 80)

      val featuredDF = cleanedDF
        .withColumn("event_timestamp", to_timestamp(col("time")))
        .withColumn("event_date", to_date(col("event_timestamp")))
        .withColumn("year", year(col("event_timestamp")))
        .withColumn("month", month(col("event_timestamp")))
        .withColumn("year_month", date_format(col("event_timestamp"), "yyyy-MM"))
        .withColumn("day_of_month", dayofmonth(col("event_timestamp")))
        .withColumn("day_of_week", date_format(col("event_timestamp"), "EEEE"))
        .withColumn("hour_of_day", hour(col("event_timestamp")))
        .withColumn("magnitude_category",
          when(col("mag") < 4.0, "Minor (3.5-3.9)")
          .when(col("mag") < 5.0, "Light (4.0-4.9)")
          .when(col("mag") < 6.0, "Moderate (5.0-5.9)")
          .when(col("mag") < 7.0, "Strong (6.0-6.9)")
          .otherwise("Major (>=7.0)")
        )
        .withColumn("depth_category",
          when(col("depth") < 70.0, "Shallow (0-70 km)")
          .when(col("depth") <= 300.0, "Intermediate (70-300 km)")
          .otherwise("Deep (>300 km)")
        )
        .withColumn("primary_region",
          when(col("place").contains(", "), trim(element_at(split(col("place"), ", "), -1)))
          .otherwise(trim(col("place")))
        )
        // Supervised target for MLlib: balanced class grouping
        .withColumn("mag_class_mllib",
          when(col("mag") < 4.0, "Minor")
          .when(col("mag") < 5.0, "Light")
          .otherwise("Moderate_Plus")
        )
        .cache()

      val featuredCount = featuredDF.count()
      println(f"  Engineered DataFrame Count : $featuredCount%,d records")
      println("\n--> Feature Engineering Schema:")
      featuredDF.printSchema()

      println("\n--> Sample Engineered Records (First 5 rows):")
      featuredDF.select("id", "event_date", "year_month", "hour_of_day", "mag", "magnitude_category", "depth", "depth_category", "primary_region", "mag_class_mllib")
        .show(5, truncate = 40)

      // Register temporary SQL view
      featuredDF.createOrReplaceTempView("earthquakes")

      // =========================================================================
      // [5/8] STAGE E — SPARK CORE AND SPARK SQL ANALYTICS
      // =========================================================================
      currentStage = "[5/8] SPARK CORE AND SPARK SQL ANALYTICS"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)

      // 1. Overall KPIs
      val overallStats = featuredDF.select(
        count("id").as("total_events"),
        min("mag").as("min_mag"),
        max("mag").as("max_mag"),
        round(avg("mag"), 3).as("avg_mag"),
        round(stddev("mag"), 3).as("stddev_mag"),
        min("depth").as("min_depth"),
        max("depth").as("max_depth"),
        round(avg("depth"), 2).as("avg_depth"),
        round(stddev("depth"), 2).as("stddev_depth")
      ).first()

      println("\n--- [Metric 1 & 2 & 3] Key Performance Indicators (KPIs) ---")
      println(f"  Total Cleaned Earthquake Events : ${overallStats.getAs[Long]("total_events")}%,d")
      println(f"  Magnitude Range [Min - Max]     : ${overallStats.getAs[Double]("min_mag")} - ${overallStats.getAs[Double]("max_mag")}")
      println(f"  Average Magnitude               : ${overallStats.getAs[Double]("avg_mag")} (StdDev: ${overallStats.getAs[Double]("stddev_mag")})")
      println(f"  Depth Range [Min - Max]         : ${overallStats.getAs[Double]("min_depth")} km - ${overallStats.getAs[Double]("max_depth")} km")
      println(f"  Average Depth                   : ${overallStats.getAs[Double]("avg_depth")} km (StdDev: ${overallStats.getAs[Double]("stddev_depth")} km)")

      // 4. Magnitude Category Distribution
      println("\n--- [Metric 4] Magnitude Category Distribution ---")
      val magDistDF = featuredDF.groupBy("magnitude_category")
        .agg(
          count("id").as("count"),
          round(avg("mag"), 2).as("avg_mag"),
          round(avg("depth"), 2).as("avg_depth")
        )
        .withColumn("percentage", round((col("count") / featuredCount) * 100.0, 2))
        .orderBy(col("avg_mag").asc)
      magDistDF.show(truncate = false)

      // 5. Depth Category Distribution
      println("\n--- [Metric 5] Depth Category Distribution ---")
      val depthDistDF = featuredDF.groupBy("depth_category")
        .agg(
          count("id").as("count"),
          round(min("depth"), 1).as("min_depth_km"),
          round(max("depth"), 1).as("max_depth_km"),
          round(avg("depth"), 2).as("avg_depth_km"),
          round(avg("mag"), 2).as("avg_mag")
        )
        .withColumn("percentage", round((col("count") / featuredCount) * 100.0, 2))
        .orderBy(col("avg_depth_km").asc)
      depthDistDF.show(truncate = false)

      // 6. Monthly Activity & Magnitude Statistics
      println("\n--- [Metric 6] Monthly Event Counts & Magnitude Statistics ---")
      println("  Note: '2026-01' represents a single-day endpoint (Jan 1, 2026), not a full calendar month.")
      val monthlyStatsDF = featuredDF.groupBy("year_month")
        .agg(
          count("id").as("event_count"),
          round(avg("mag"), 3).as("avg_mag"),
          max("mag").as("max_mag"),
          round(avg("depth"), 2).as("avg_depth_km")
        )
        .withColumn("period_note",
          when(col("year_month") === "2026-01", "Endpoint (Single Day: Jan 1)")
          .otherwise("Full Calendar Month")
        )
        .orderBy("year_month")
      monthlyStatsDF.show(15, truncate = false)

      // 7. Hourly Activity Summary
      println("\n--- [Metric 7] Hourly Activity Distribution (00:00 to 23:00 UTC) ---")
      val hourlyDistDF = featuredDF.groupBy("hour_of_day")
        .agg(
          count("id").as("event_count"),
          round(avg("mag"), 2).as("avg_mag")
        )
        .orderBy("hour_of_day")
      hourlyDistDF.show(24, truncate = false)

      // 8. Top 15 Most Active Locations / Regions
      println("\n--- [Metric 8] Top 15 Most Active Seismic Regions ---")
      val topRegionsDF = featuredDF.groupBy("primary_region")
        .agg(
          count("id").as("event_count"),
          round(avg("mag"), 2).as("avg_mag"),
          max("mag").as("max_mag"),
          round(avg("depth"), 1).as("avg_depth_km")
        )
        .withColumn("pct_of_global", round((col("event_count") / featuredCount) * 100.0, 2))
        .orderBy(col("event_count").desc)
      topRegionsDF.show(15, truncate = false)

      // 9. Ten Strongest Recorded Earthquakes
      println("\n--- [Metric 9] Ten Strongest Recorded Earthquakes (2025 - Jan 2026) ---")
      val strongestEventsDF = featuredDF
        .select("id", "event_date", "time", "mag", "magType", "depth", "primary_region", "place")
        .orderBy(col("mag").desc, col("depth").asc)
        .limit(10)
      strongestEventsDF.show(10, truncate = 60)

      // 10. Regional Seismological Profile (Deep vs Shallow)
      println("\n--- [Metric 10] Regional Seismological Depth Profile (Top 10 Regions) ---")
      val regionalProfileDF = spark.sql(
        """
          |SELECT
          |  primary_region,
          |  COUNT(*) AS total_events,
          |  ROUND(AVG(mag), 2) AS avg_magnitude,
          |  MAX(mag) AS max_magnitude,
          |  ROUND(AVG(depth), 1) AS avg_depth_km,
          |  SUM(CASE WHEN depth < 70 THEN 1 ELSE 0 END) AS shallow_count,
          |  SUM(CASE WHEN depth >= 70 AND depth <= 300 THEN 1 ELSE 0 END) AS intermediate_count,
          |  SUM(CASE WHEN depth > 300 THEN 1 ELSE 0 END) AS deep_count
          |FROM earthquakes
          |GROUP BY primary_region
          |ORDER BY total_events DESC
          |LIMIT 10
        """.stripMargin
      )
      regionalProfileDF.show(truncate = false)

      // 12. Meaningful Spark SQL Queries Using Temporary Views
      println("\n--- [Metric 12] Spark SQL Query 1: Monthly Seismic Profile & Activity Trend ---")
      val sqlMonthlyDF = spark.sql(
        """
          |SELECT
          |  year_month,
          |  COUNT(*) AS total_quakes,
          |  ROUND(MIN(mag), 2) AS min_magnitude,
          |  ROUND(AVG(mag), 2) AS avg_magnitude,
          |  ROUND(MAX(mag), 2) AS max_magnitude,
          |  ROUND(AVG(depth), 2) AS avg_depth_km,
          |  SUM(CASE WHEN mag >= 6.0 THEN 1 ELSE 0 END) AS major_events_count
          |FROM earthquakes
          |GROUP BY year_month
          |ORDER BY year_month ASC
        """.stripMargin
      )
      sqlMonthlyDF.show(15, truncate = false)

      println("\n--- [Metric 12] Spark SQL Query 2: Deep-Focus Seismic Hotspots (Depth > 300 km) ---")
      val sqlDeepDF = spark.sql(
        """
          |SELECT
          |  primary_region,
          |  COUNT(*) AS deep_quake_count,
          |  ROUND(AVG(depth), 1) AS avg_deep_depth_km,
          |  ROUND(MAX(depth), 1) AS max_depth_km,
          |  ROUND(AVG(mag), 2) AS avg_magnitude,
          |  MAX(mag) AS max_magnitude
          |FROM earthquakes
          |WHERE depth > 300.0
          |GROUP BY primary_region
          |HAVING COUNT(*) >= 5
          |ORDER BY deep_quake_count DESC
        """.stripMargin
      )
      sqlDeepDF.show(10, truncate = false)

      println("\n--- [Metric 12] Spark SQL Query 3: High-Impact Seismic Events (Mag >= 6.5) ---")
      val sqlHighImpactDF = spark.sql(
        """
          |SELECT
          |  id,
          |  event_date,
          |  mag,
          |  depth,
          |  latitude,
          |  longitude,
          |  primary_region,
          |  place
          |FROM earthquakes
          |WHERE mag >= 6.5
          |ORDER BY mag DESC, depth ASC
        """.stripMargin
      )
      sqlHighImpactDF.show(15, truncate = 50)

      // =========================================================================
      // [6/8] STAGE F — WINDOW FUNCTION RANKING
      // =========================================================================
      currentStage = "[6/8] WINDOW FUNCTION RANKING"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)
      println("Ranking Top 3 Strongest Earthquakes within the Top 5 Global Seismic Hotspots...")
      println("Using Spark Window Function: Window.partitionBy('primary_region').orderBy(col('mag').desc)")

      val top5RegionList = topRegionsDF.limit(5).select("primary_region").as[String].collect().toSeq
      val regionalWindow = Window.partitionBy("primary_region").orderBy(col("mag").desc, col("depth").asc)

      val rankedRegionalDF = featuredDF
        .filter(col("primary_region").isin(top5RegionList: _*))
        .withColumn("regional_rank", dense_rank().over(regionalWindow))
        .filter(col("regional_rank") <= 3)
        .select("primary_region", "regional_rank", "id", "event_date", "mag", "depth", "place")
        .orderBy(col("primary_region"), col("regional_rank"))

      rankedRegionalDF.show(20, truncate = 50)

      // =========================================================================
      // [7/8] STAGE G — SPARK MLLIB MODEL TRAINING AND EVALUATION
      // =========================================================================
      currentStage = "[7/8] SPARK MLLIB MODEL TRAINING AND EVALUATION"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)
      println("Supervised Pattern Classification Pipeline:")
      println("  Algorithm         : DecisionTreeClassifier (Multiclass)")
      println("  Target Label      : mag_class_mllib (Minor [<4.0], Light [4.0-4.9], Moderate_Plus [>=5.0])")
      println("  Input Features    : latitude, longitude, depth")
      println("  Feature Exclusion : 'mag', 'magType', station counts, and derivatives EXCLUDED to eliminate data leakage.")
      println("  Partition Policy  : Split BEFORE fitting label indexer or transformers to eliminate pre-processing leakage.")
      println("  Train/Test Split  : 80% Train, 20% Test (Deterministic Random Split with seed = 42L)")

      // 1. SPLIT DATA FIRST before fitting any transformer
      val Array(trainRaw, testRaw) = featuredDF.randomSplit(Array(0.8, 0.2), seed = 42L)
      val trainCount = trainRaw.count()
      val testCount = testRaw.count()

      println(f"\n  Training Records  : $trainCount%,d (${(trainCount.toDouble/featuredCount)*100.0}%.2f%%)")
      println(f"  Test Records      : $testCount%,d (${(testCount.toDouble/featuredCount)*100.0}%.2f%%)")

      // 2. FIT LEARNED PREPROCESSING ON TRAINING DATA ONLY
      val labelIndexer = new StringIndexer()
        .setInputCol("mag_class_mllib")
        .setOutputCol("label")
        .setHandleInvalid("skip") // Handle unknown test labels safely
        .fit(trainRaw)

      val assembler = new VectorAssembler()
        .setInputCols(Array("latitude", "longitude", "depth"))
        .setOutputCol("features")
        .setHandleInvalid("skip") // Handle missing features safely

      val trainIndexed = labelIndexer.transform(trainRaw)
      val trainData = assembler.transform(trainIndexed).cache()

      val testIndexed = labelIndexer.transform(testRaw)
      val testData = assembler.transform(testIndexed).cache()

      // Target class index mapping
      val labelMap = labelIndexer.labels.zipWithIndex.toMap
      println("\n  Target Class Index Mapping (Fit on Training Data Only):")
      labelMap.toSeq.sortBy(_._2).foreach { case (lbl, idx) =>
        println(f"    Index $idx -> $lbl")
      }

      println("\n--> Training Set Class Distribution:")
      trainData.groupBy("mag_class_mllib", "label").count().orderBy("label").show(truncate = false)

      println("--> Test Set Class Distribution:")
      testData.groupBy("mag_class_mllib", "label").count().orderBy("label").show(truncate = false)

      // 3. HYPERPARAMETER EXPLORATION ON TRAINING SPLIT ONLY (Validation Tuning)
      println("--> Hyperparameter exploration on training partition (maxDepth tuning)...")
      val Array(subTrain, subVal) = trainData.randomSplit(Array(0.8, 0.2), seed = 42L)
      val depthsToTest = Seq(3, 5, 7)
      val tuningEvaluator = new MulticlassClassificationEvaluator().setLabelCol("label").setPredictionCol("prediction").setMetricName("f1")

      var bestDepth = 5
      var bestValF1 = -1.0

      depthsToTest.foreach { d =>
        val dtCandidate = new DecisionTreeClassifier().setLabelCol("label").setFeaturesCol("features").setMaxDepth(d).setSeed(42L)
        val mCandidate = dtCandidate.fit(subTrain)
        val valPreds = mCandidate.transform(subVal)
        val valF1 = tuningEvaluator.evaluate(valPreds)
        println(f"    Candidate maxDepth = $d%-2d | Validation F1 = $valF1%.4f")
        if (valF1 > bestValF1) {
          bestValF1 = valF1
          bestDepth = d
        }
      }
      println(f"  Selected Optimal Hyperparameter: maxDepth = $bestDepth (Validation F1: $bestValF1%.4f)")

      // 4. FIT FINAL MODEL ON FULL TRAINING DATASET
      println(f"--> Fitting final DecisionTreeClassifier (maxDepth = $bestDepth) on full training dataset...")
      val finalDT = new DecisionTreeClassifier()
        .setLabelCol("label")
        .setFeaturesCol("features")
        .setMaxDepth(bestDepth)
        .setSeed(42L)

      val model: DecisionTreeClassificationModel = finalDT.fit(trainData)
      println(f"  Decision Tree Model Trained Successfully! (Tree Depth: ${model.depth}, Total Nodes: ${model.numNodes})")

      // 5. EVALUATION ON HELD-OUT TEST DATA
      println("--> Evaluating predictions on held-out test split...")
      val predictions = model.transform(testData).cache()

      val evaluatorAcc = new MulticlassClassificationEvaluator().setLabelCol("label").setPredictionCol("prediction").setMetricName("accuracy")
      val evaluatorF1 = new MulticlassClassificationEvaluator().setLabelCol("label").setPredictionCol("prediction").setMetricName("f1")
      val evaluatorPrec = new MulticlassClassificationEvaluator().setLabelCol("label").setPredictionCol("prediction").setMetricName("weightedPrecision")
      val evaluatorRec = new MulticlassClassificationEvaluator().setLabelCol("label").setPredictionCol("prediction").setMetricName("weightedRecall")

      val testAccuracy = evaluatorAcc.evaluate(predictions)
      val testWeightedF1 = evaluatorF1.evaluate(predictions)
      val testWeightedPrecision = evaluatorPrec.evaluate(predictions)
      val testWeightedRecall = evaluatorRec.evaluate(predictions)

      // Multiclass Metrics for confusion matrix and per-class stats
      val predAndLabelsRDD = predictions.select("prediction", "label").rdd.map(r => (r.getDouble(0), r.getDouble(1)))
      val multiclassMetrics = new MulticlassMetrics(predAndLabelsRDD)
      val confMatrix = multiclassMetrics.confusionMatrix
      val labels = multiclassMetrics.labels

      // Majority-class baseline computation
      val majorityClassCount = testData.filter(col("label") === 0.0).count() // Label 0 is Light (majority)
      val majorityBaselineAccuracy = majorityClassCount.toDouble / testCount.toDouble

      // Macro-averaged F1 and Balanced Accuracy (unweighted mean of per-class recall)
      val perClassMetrics = labels.sorted.map { l =>
        val name = labelMap.find(_._2 == l.toInt).map(_._1).getOrElse("Unknown")
        val prec = multiclassMetrics.precision(l)
        val rec = multiclassMetrics.recall(l)
        val f1Val = multiclassMetrics.fMeasure(l)
        (name, l.toInt, prec, rec, f1Val)
      }

      val macroF1 = perClassMetrics.map(_._5).sum / perClassMetrics.length
      val balancedAccuracy = perClassMetrics.map(_._4).sum / perClassMetrics.length

      println("\n" + "=" * 70)
      println("  SPARK MLLIB MODEL EVALUATION METRICS (HELD-OUT TEST SET)")
      println("=" * 70)
      println(f"  Test Accuracy               : $testAccuracy%.4f (${testAccuracy * 100.0}%.2f%%)")
      println(f"  Majority-Class Baseline     : $majorityBaselineAccuracy%.4f (${majorityBaselineAccuracy * 100.0}%.2f%%)")
      println(f"  Balanced Accuracy           : $balancedAccuracy%.4f (${balancedAccuracy * 100.0}%.2f%%)")
      println(f"  Weighted Precision          : $testWeightedPrecision%.4f")
      println(f"  Weighted Recall             : $testWeightedRecall%.4f")
      println(f"  Weighted F1 Score           : $testWeightedF1%.4f")
      println(f"  Macro-Averaged F1           : $macroF1%.4f")
      println("=" * 70)

      println("\n--> Detailed Class-Level Performance:")
      println(f"  ${"Class Name"}%-15s | ${"Class Index"}%11s | ${"Precision"}%10s | ${"Recall"}%10s | ${"F1-Score"}%10s")
      println("-" * 70)
      perClassMetrics.foreach { case (name, idx, prec, rec, f1Val) =>
        println(f"  $name%-15s | $idx%11d | $prec%10.4f | $rec%10.4f | $f1Val%10.4f")
      }

      println("\n--> Labeled Confusion Matrix (Rows = Actual Labels, Columns = Predicted Labels):")
      val sortedLabels = labelMap.toSeq.sortBy(_._2).map(_._1)
      val headerStr = sortedLabels.map(lbl => f"$lbl%14s").mkString(" ")
      println(f"  ${"Actual \\ Pred"}%-16s | $headerStr")
      println("  " + "-" * (20 + 15 * sortedLabels.length))
      for (r <- 0 until labelMap.size) {
        val actualName = sortedLabels(r)
        val rowVals = (0 until labelMap.size).map(c => f"${confMatrix(r, c)}%14.0f").mkString(" ")
        println(f"  $actualName%-16s | $rowVals")
      }

      // =========================================================================
      // [8/8] STAGE H — EXPORT AND FINAL VALIDATION
      // =========================================================================
      currentStage = "[8/8] EXPORT AND FINAL VALIDATION"
      println("\n" + "#" * 80)
      println(s"$currentStage")
      println("#" * 80)

      val outDir = new File("/mnt/c/QuakeScope/output")
      val dashDir = new File("/mnt/c/QuakeScope/output/dashboard")
      if (!outDir.exists()) outDir.mkdirs()
      if (!dashDir.exists()) dashDir.mkdirs()

      println("--> Exporting clean JSON and CSV analytical assets for dashboard...")

      // Helpers for text export
      def writeTextFile(file: File, content: String): Unit = {
        val pw = new PrintWriter(new FileWriter(file))
        try { pw.write(content) } finally { pw.close() }
      }

      def escapeCsv(value: Any): String = {
        if (value == null) ""
        else {
          val s = value.toString
          if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            "\"" + s.replace("\"", "\"\"") + "\""
          } else {
            s
          }
        }
      }

      // 1. Export KPIs & Cleaning JSON
      val kpiJson =
        s"""{
           |  "project": "QuakeScope",
           |  "stage": "1.1",
           |  "generated_at": "${LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)}",
           |  "environment": {
           |    "spark_version": "${spark.version}",
           |    "scala_version": "${util.Properties.versionString}",
           |    "java_version": "${System.getProperty("java.version")}",
           |    "dataset_path": "$dataPath"
           |  },
           |  "cleaning_reconciliation": {
           |    "original_rows": $rawCount,
           |    "duplicate_rows_removed": $duplicatesRemoved,
           |    "missing_essential_fields": $missingEssentialCount,
           |    "invalid_timestamps": $invalidTimestampCount,
           |    "invalid_coordinates": $invalidCoordinatesCount,
           |    "invalid_magnitude": $invalidMagnitudeCount,
           |    "invalid_depth_subsurface": $invalidDepthCount,
           |    "excluded_non_earthquake": $nonEarthquakeCount,
           |    "total_excluded": ${duplicatesRemoved + totalExcluded},
           |    "cleaned_retained_rows": $cleanedCount,
           |    "retained_missing_optional_quality": $retainedWithMissingOpt,
           |    "reconciliation_balanced": ${accountedTotal == rawCount}
           |  },
           |  "overall_kpis": {
           |    "total_events": ${overallStats.getAs[Long]("total_events")},
           |    "min_magnitude": ${overallStats.getAs[Double]("min_mag")},
           |    "max_magnitude": ${overallStats.getAs[Double]("max_mag")},
           |    "avg_magnitude": ${overallStats.getAs[Double]("avg_mag")},
           |    "stddev_magnitude": ${overallStats.getAs[Double]("stddev_mag")},
           |    "min_depth_km": ${overallStats.getAs[Double]("min_depth")},
           |    "max_depth_km": ${overallStats.getAs[Double]("max_depth")},
           |    "avg_depth_km": ${overallStats.getAs[Double]("avg_depth")},
           |    "stddev_depth_km": ${overallStats.getAs[Double]("stddev_depth")}
           |  }
           |}
         """.stripMargin
      writeTextFile(new File(dashDir, "kpis_and_cleaning.json"), kpiJson)

      // 2. Export Monthly Trends JSON & CSV
      val monthlyRows = monthlyStatsDF.collect()
      val monthlyJsonArray = monthlyRows.map { r =>
        s"""    {
           |      "year_month": "${r.getAs[String]("year_month")}",
           |      "event_count": ${r.getAs[Long]("event_count")},
           |      "avg_mag": ${r.getAs[Double]("avg_mag")},
           |      "max_mag": ${r.getAs[Double]("max_mag")},
           |      "avg_depth_km": ${r.getAs[Double]("avg_depth_km")},
           |      "period_note": "${r.getAs[String]("period_note")}"
           |    }""".stripMargin
      }.mkString(",\n")
      writeTextFile(new File(dashDir, "monthly_trends.json"), s"[\n$monthlyJsonArray\n]")

      val monthlyCsv = "year_month,event_count,avg_mag,max_mag,avg_depth_km,period_note\n" +
        monthlyRows.map(r => s"${escapeCsv(r.getAs[String]("year_month"))},${r.getAs[Long]("event_count")},${r.getAs[Double]("avg_mag")},${r.getAs[Double]("max_mag")},${r.getAs[Double]("avg_depth_km")},${escapeCsv(r.getAs[String]("period_note"))}").mkString("\n")
      writeTextFile(new File(dashDir, "monthly_trends.csv"), monthlyCsv)

      // 3. Export Magnitude Distribution JSON & CSV
      val magRows = magDistDF.collect()
      val magJsonArray = magRows.map { r =>
        s"""    {
           |      "category": "${r.getAs[String]("magnitude_category")}",
           |      "count": ${r.getAs[Long]("count")},
           |      "percentage": ${r.getAs[Double]("percentage")},
           |      "avg_mag": ${r.getAs[Double]("avg_mag")},
           |      "avg_depth": ${r.getAs[Double]("avg_depth")}
           |    }""".stripMargin
      }.mkString(",\n")
      writeTextFile(new File(dashDir, "magnitude_distribution.json"), s"[\n$magJsonArray\n]")

      val magCsv = "category,count,percentage,avg_mag,avg_depth\n" +
        magRows.map(r => s"${escapeCsv(r.getAs[String]("magnitude_category"))},${r.getAs[Long]("count")},${r.getAs[Double]("percentage")},${r.getAs[Double]("avg_mag")},${r.getAs[Double]("avg_depth")}").mkString("\n")
      writeTextFile(new File(dashDir, "magnitude_distribution.csv"), magCsv)

      // 4. Export Depth Distribution JSON & CSV
      val depthRows = depthDistDF.collect()
      val depthJsonArray = depthRows.map { r =>
        s"""    {
           |      "category": "${r.getAs[String]("depth_category")}",
           |      "count": ${r.getAs[Long]("count")},
           |      "percentage": ${r.getAs[Double]("percentage")},
           |      "min_depth_km": ${r.getAs[Double]("min_depth_km")},
           |      "max_depth_km": ${r.getAs[Double]("max_depth_km")},
           |      "avg_depth_km": ${r.getAs[Double]("avg_depth_km")},
           |      "avg_mag": ${r.getAs[Double]("avg_mag")}
           |    }""".stripMargin
      }.mkString(",\n")
      writeTextFile(new File(dashDir, "depth_distribution.json"), s"[\n$depthJsonArray\n]")

      val depthCsv = "category,count,percentage,min_depth_km,max_depth_km,avg_depth_km,avg_mag\n" +
        depthRows.map(r => s"${escapeCsv(r.getAs[String]("depth_category"))},${r.getAs[Long]("count")},${r.getAs[Double]("percentage")},${r.getAs[Double]("min_depth_km")},${r.getAs[Double]("max_depth_km")},${r.getAs[Double]("avg_depth_km")},${r.getAs[Double]("avg_mag")}").mkString("\n")
      writeTextFile(new File(dashDir, "depth_distribution.csv"), depthCsv)

      // 5. Export Top Regions JSON & CSV
      val topRegRows = topRegionsDF.collect()
      val topRegJsonArray = topRegRows.map { r =>
        s"""    {
           |      "region": "${escapeJson(r.getAs[String]("primary_region"))}",
           |      "event_count": ${r.getAs[Long]("event_count")},
           |      "pct_of_global": ${r.getAs[Double]("pct_of_global")},
           |      "avg_mag": ${r.getAs[Double]("avg_mag")},
           |      "max_mag": ${r.getAs[Double]("max_mag")},
           |      "avg_depth_km": ${r.getAs[Double]("avg_depth_km")}
           |    }""".stripMargin
      }.mkString(",\n")
      writeTextFile(new File(dashDir, "top_regions.json"), s"[\n$topRegJsonArray\n]")

      val topRegCsv = "region,event_count,pct_of_global,avg_mag,max_mag,avg_depth_km\n" +
        topRegRows.map(r => s"${escapeCsv(r.getAs[String]("primary_region"))},${r.getAs[Long]("event_count")},${r.getAs[Double]("pct_of_global")},${r.getAs[Double]("avg_mag")},${r.getAs[Double]("max_mag")},${r.getAs[Double]("avg_depth_km")}").mkString("\n")
      writeTextFile(new File(dashDir, "top_regions.csv"), topRegCsv)

      // 6. Export Strongest Events JSON & CSV
      val strongestRows = strongestEventsDF.collect()
      val strongestJsonArray = strongestRows.map { r =>
        s"""    {
           |      "id": "${r.getAs[String]("id")}",
           |      "event_date": "${r.getAs[java.sql.Date]("event_date")}",
           |      "time": "${r.getAs[String]("time")}",
           |      "mag": ${r.getAs[Double]("mag")},
           |      "magType": "${r.getAs[String]("magType")}",
           |      "depth": ${r.getAs[Double]("depth")},
           |      "region": "${escapeJson(r.getAs[String]("primary_region"))}",
           |      "place": "${escapeJson(r.getAs[String]("place"))}"
           |    }""".stripMargin
      }.mkString(",\n")
      writeTextFile(new File(dashDir, "strongest_events.json"), s"[\n$strongestJsonArray\n]")

      val strongestCsv = "id,event_date,time,mag,magType,depth,region,place\n" +
        strongestRows.map(r => s"${escapeCsv(r.getAs[String]("id"))},${escapeCsv(r.getAs[java.sql.Date]("event_date"))},${escapeCsv(r.getAs[String]("time"))},${r.getAs[Double]("mag")},${escapeCsv(r.getAs[String]("magType"))},${r.getAs[Double]("depth")},${escapeCsv(r.getAs[String]("primary_region"))},${escapeCsv(r.getAs[String]("place"))}").mkString("\n")
      writeTextFile(new File(dashDir, "strongest_events.csv"), strongestCsv)

      // 7. Export Hourly Distribution JSON
      val hourlyRows = hourlyDistDF.collect()
      val hourlyJsonArray = hourlyRows.map { r =>
        s"""    {
           |      "hour_utc": ${r.getAs[Int]("hour_of_day")},
           |      "event_count": ${r.getAs[Long]("event_count")},
           |      "avg_mag": ${r.getAs[Double]("avg_mag")}
           |    }""".stripMargin
      }.mkString(",\n")
      writeTextFile(new File(dashDir, "hourly_distribution.json"), s"[\n$hourlyJsonArray\n]")

      // 8. Export MLlib Metrics JSON
      val classMetricsJson = perClassMetrics.map { case (name, idx, prec, rec, f1Val) =>
        s"""    {
           |      "class_name": "$name",
           |      "class_index": $idx,
           |      "precision": ${roundMetric(prec)},
           |      "recall": ${roundMetric(rec)},
           |      "f1_score": ${roundMetric(f1Val)}
           |    }""".stripMargin
      }.mkString(",\n")

      // Extract row-by-row confusion matrix correctly
      val matrixRowsJson = (0 until labelMap.size).map { r =>
        val rowVals = (0 until labelMap.size).map(c => confMatrix(r, c).toLong).mkString(", ")
        s"      [$rowVals]"
      }.mkString(",\n")

      val mllibJson =
        s"""{
           |  "model_type": "DecisionTreeClassifier",
           |  "target_column": "mag_class_mllib",
           |  "input_features": ["latitude", "longitude", "depth"],
           |  "training_records": $trainCount,
           |  "test_records": $testCount,
           |  "split_ratio": "80/20",
           |  "random_seed": 42,
           |  "tree_depth": ${model.depth},
           |  "tree_num_nodes": ${model.numNodes},
           |  "evaluation_metrics": {
           |    "test_accuracy": ${roundMetric(testAccuracy)},
           |    "majority_baseline_accuracy": ${roundMetric(majorityBaselineAccuracy)},
           |    "balanced_accuracy": ${roundMetric(balancedAccuracy)},
           |    "weighted_precision": ${roundMetric(testWeightedPrecision)},
           |    "weighted_recall": ${roundMetric(testWeightedRecall)},
           |    "weighted_f1_score": ${roundMetric(testWeightedF1)},
           |    "macro_f1_score": ${roundMetric(macroF1)}
           |  },
           |  "class_metrics": [
           |$classMetricsJson
           |  ],
           |  "confusion_matrix": {
           |    "labels": [${sortedLabels.map(x => "\"" + x + "\"").mkString(", ")}],
           |    "matrix_rows_actual": [
           |$matrixRowsJson
           |    ]
           |  }
           |}
         """.stripMargin
      writeTextFile(new File(dashDir, "mllib_metrics.json"), mllibJson)

      // =========================================================================
      // STRICT ASSET CONTENT & SYNTAX VALIDATION
      // =========================================================================
      println("\n--> Rigorously Validating Exported Static Assets (Content & Syntax Parsing):")

      val jsonFiles = Seq(
        "kpis_and_cleaning.json",
        "monthly_trends.json",
        "magnitude_distribution.json",
        "depth_distribution.json",
        "top_regions.json",
        "strongest_events.json",
        "hourly_distribution.json",
        "mllib_metrics.json"
      )

      val csvFilesWithExpectedCols = Seq(
        ("monthly_trends.csv", 6),
        ("magnitude_distribution.csv", 5),
        ("depth_distribution.csv", 7),
        ("top_regions.csv", 6),
        ("strongest_events.csv", 8)
      )

      val mapper = new ObjectMapper()
      println(f"  ${"Filename"}%-30s | ${"Type"}%-6s | ${"Status"}%-8s | ${"Size (Bytes)"}%12s | ${"Validation Note"}")
      println("-" * 85)

      // Validate JSON files
      jsonFiles.foreach { fname =>
        val f = new File(dashDir, fname)
        if (!f.exists() || f.length() == 0) {
          throw new IllegalStateException(s"Exported JSON file $fname is missing or empty!")
        }
        val tree = mapper.readTree(f)
        if (tree == null || tree.isMissingNode) {
          throw new IllegalStateException(s"Parsed JSON tree in $fname is empty or invalid!")
        }
        println(f"  $fname%-30s | JSON   | VALID    | ${f.length()}%12d | Validated Jackson Syntax Tree")
      }

      // Validate CSV files
      csvFilesWithExpectedCols.foreach { case (fname, expectedCols) =>
        val f = new File(dashDir, fname)
        val rowCount = validateCsvFile(f, expectedCols)
        println(f"  $fname%-30s | CSV    | VALID    | ${f.length()}%12d | Validated $rowCount data rows ($expectedCols cols)")
      }

      val elapsedTime = (System.currentTimeMillis() - startTime) / 1000.0

      println("\n" + "=" * 80)
      println("  [SUCCESS] QuakeScope Core Engine Completed All 8 Stages Successfully!")
      println(f"  Total Ingested Records    : $rawCount%,d")
      println(f"  Final Cleaned Earthquakes : $cleanedCount%,d")
      println(f"  MLlib Model Test Accuracy : ${testAccuracy * 100.0}%.2f%% (Majority Baseline: ${majorityBaselineAccuracy * 100.0}%.2f%%)")
      println(f"  MLlib Macro F1-Score      : $macroF1%.4f (Weighted F1: $testWeightedF1%.4f)")
      println(f"  Exported Dashboard Assets : ${jsonFiles.length + csvFilesWithExpectedCols.length} verified files in output/dashboard/")
      println(f"  Total Processing Time     : $elapsedTime%.2f seconds")
      println("=" * 80 + "\n")

    } catch {
      case ex: Throwable =>
        System.err.println("\n" + "!" * 80)
        System.err.println(s"[FATAL FAILURE] Stage Execution Failed at Stage: $currentStage")
        System.err.println(s"Error Message : ${ex.getMessage}")
        System.err.println("!" * 80)
        ex.printStackTrace()
        spark.stop()
        System.exit(1)
    } finally {
      spark.stop()
    }
  }

  private def escapeJson(str: String): String = {
    if (str == null) ""
    else {
      str.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\b", "\\b")
        .replace("\f", "\\f")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
    }
  }

  private def roundMetric(v: Double): Double = {
    if (v.isNaN || v.isInfinite) 0.0
    else BigDecimal(v).setScale(4, BigDecimal.RoundingMode.HALF_UP).toDouble
  }

  private def validateCsvFile(file: File, expectedColCount: Int): Int = {
    if (!file.exists() || file.length() == 0) {
      throw new IllegalStateException(s"Exported CSV file is missing or empty: ${file.getAbsolutePath}")
    }
    val src = scala.io.Source.fromFile(file, "UTF-8")
    try {
      val lines = src.getLines().filter(_.trim.nonEmpty).toList
      if (lines.isEmpty) {
        throw new IllegalStateException(s"CSV file has no data lines: ${file.getAbsolutePath}")
      }

      def parseLine(line: String): Array[String] = {
        val tokens = scala.collection.mutable.ArrayBuffer[String]()
        val sb = new StringBuilder
        var inQuotes = false
        var i = 0
        while (i < line.length) {
          val c = line.charAt(i)
          if (c == '\"') {
            if (inQuotes && i + 1 < line.length && line.charAt(i + 1) == '\"') {
              sb.append('\"')
              i += 1
            } else {
              inQuotes = !inQuotes
            }
          } else if (c == ',' && !inQuotes) {
            tokens += sb.toString()
            sb.clear()
          } else {
            sb.append(c)
          }
          i += 1
        }
        tokens += sb.toString()
        tokens.toArray
      }

      val headerCols = parseLine(lines.head)
      if (headerCols.length != expectedColCount) {
        throw new IllegalStateException(s"CSV header column count mismatch in ${file.getName}: expected $expectedColCount, found ${headerCols.length}")
      }
      if (lines.tail.isEmpty) {
        throw new IllegalStateException(s"CSV file has header but zero data rows: ${file.getName}")
      }
      for ((line, idx) <- lines.tail.zipWithIndex) {
        val rowCols = parseLine(line)
        if (rowCols.length != expectedColCount) {
          throw new IllegalStateException(s"Malformed CSV row at line ${idx + 2} in ${file.getName}: expected $expectedColCount columns, found ${rowCols.length}")
        }
      }
      lines.tail.length
    } finally {
      src.close()
    }
  }
}
