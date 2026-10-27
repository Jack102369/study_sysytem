-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: study_system
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `hs_math_train_item_diagrams`
--

DROP TABLE IF EXISTS `hs_math_train_item_diagrams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hs_math_train_item_diagrams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL,
  `object_id` bigint unsigned NOT NULL,
  `sort_order` tinyint unsigned NOT NULL COMMENT '1..3 展示顺序',
  `alt_text` varchar(256) DEFAULT NULL COMMENT '无答案暗示的短说明',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hs_math_item_diagram_ord` (`item_id`,`sort_order`),
  KEY `idx_hs_math_item_diagram_obj` (`object_id`),
  CONSTRAINT `fk_hs_math_item_diagram_item` FOREIGN KEY (`item_id`) REFERENCES `hs_math_train_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hs_math_item_diagram_obj` FOREIGN KEY (`object_id`) REFERENCES `hs_math_train_item_diagram_objects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='题目当前配图关联；每题最多3张';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hs_math_train_item_diagrams`
--

LOCK TABLES `hs_math_train_item_diagrams` WRITE;
/*!40000 ALTER TABLE `hs_math_train_item_diagrams` DISABLE KEYS */;
INSERT INTO `hs_math_train_item_diagrams` VALUES (1,244,1,1,'正方体示意：标出 BD1 与平面 A1C1D','2026-10-26 20:48:16.760','2026-10-26 20:48:16.760'),(2,231,2,1,'平行四边形 ABCD 与向量 a、b','2026-10-26 20:49:53.254','2026-10-26 20:49:53.254'),(3,215,3,1,'塔高测量：水平距离 40m 与仰角示意','2026-10-26 20:49:53.729','2026-10-26 20:49:53.729'),(4,242,4,1,'斜二测两套坐标系对照示意','2026-10-26 20:49:54.056','2026-10-26 20:49:54.056');
/*!40000 ALTER TABLE `hs_math_train_item_diagrams` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27  8:41:50
