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
-- Table structure for table `hs_math_train_item_methods`
--

DROP TABLE IF EXISTS `hs_math_train_item_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hs_math_train_item_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL,
  `method_id` bigint unsigned NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0' COMMENT '主方法；应用层保证每题至多一个 true',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hs_math_item_method` (`item_id`,`method_id`),
  KEY `idx_hs_math_item_method_method` (`method_id`),
  KEY `idx_hs_math_item_method_primary` (`item_id`,`is_primary`),
  CONSTRAINT `fk_hs_math_item_method_item` FOREIGN KEY (`item_id`) REFERENCES `hs_math_train_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hs_math_item_method_method` FOREIGN KEY (`method_id`) REFERENCES `hs_math_methods` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='题目与解题方法多对多';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hs_math_train_item_methods`
--

LOCK TABLES `hs_math_train_item_methods` WRITE;
/*!40000 ALTER TABLE `hs_math_train_item_methods` DISABLE KEYS */;
INSERT INTO `hs_math_train_item_methods` VALUES (75,109,30,1,10,'2026-10-25 11:37:26.750'),(76,110,30,1,10,'2026-10-25 11:37:26.874'),(77,110,31,0,20,'2026-10-25 11:37:26.875'),(78,113,30,1,10,'2026-10-25 11:37:26.995'),(79,113,31,0,20,'2026-10-25 11:37:26.996'),(80,114,31,1,10,'2026-10-25 11:37:27.095'),(81,115,31,1,10,'2026-10-25 11:37:27.205'),(82,118,30,1,10,'2026-10-25 11:37:27.305'),(83,119,30,1,10,'2026-10-25 11:37:27.430'),(84,120,30,1,10,'2026-10-25 11:37:27.522'),(85,120,32,0,20,'2026-10-25 11:37:27.523'),(86,123,37,1,10,'2026-10-25 11:37:27.638'),(87,127,33,1,10,'2026-10-25 11:37:28.162'),(88,127,34,0,20,'2026-10-25 11:37:28.163'),(89,128,33,1,10,'2026-10-25 11:37:28.435'),(90,133,37,1,10,'2026-10-25 11:37:28.677'),(91,151,36,1,10,'2026-10-25 13:49:09.737'),(92,151,38,0,20,'2026-10-25 13:49:09.739');
/*!40000 ALTER TABLE `hs_math_train_item_methods` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-26 16:43:22
