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
-- Table structure for table `hs_math_specialties`
--

DROP TABLE IF EXISTS `hs_math_specialties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hs_math_specialties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL COMMENT '????',
  `name` varchar(64) NOT NULL,
  `book_code` varchar(32) DEFAULT NULL COMMENT '???/????',
  `chapter_no` int DEFAULT NULL,
  `intro` varchar(255) NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hs_math_specialty_code` (`code`),
  KEY `idx_hs_math_specialty_active_sort` (`is_active`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hs_math_specialties`
--

LOCK TABLES `hs_math_specialties` WRITE;
/*!40000 ALTER TABLE `hs_math_specialties` DISABLE KEYS */;
INSERT INTO `hs_math_specialties` VALUES (16,'rja-ch1','集合与常用逻辑用语','必修一',1,'',10,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(17,'rja-ch2','一元二次函数、方程和不等式','必修一',2,'',20,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(18,'rja-ch3','函数的概念与性质','必修一',3,'',30,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(19,'rja-ch4','指数函数与对数函数','必修一',4,'',40,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(20,'rja-ch5','三角函数','必修一',5,'',50,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(21,'rjb-ch1','平面向量及其应用','必修二',1,'',60,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(22,'rjb-ch2','复数','必修二',2,'',70,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(23,'rjb-ch3','立体几何初步','必修二',3,'',80,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(24,'rjb-ch4','统计','必修二',4,'',90,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656'),(25,'rjb-ch5','概率','必修二',5,'',100,1,'2026-10-24 09:22:29.656','2026-10-24 09:22:29.656');
/*!40000 ALTER TABLE `hs_math_specialties` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-26 14:58:26
