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
-- Table structure for table `hs_math_train_item_reviews`
--

DROP TABLE IF EXISTS `hs_math_train_item_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hs_math_train_item_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL COMMENT '题目 ID',
  `content_version` int NOT NULL COMMENT '审核时题目 content_version',
  `content_fingerprint` char(64) NOT NULL COMMENT '服务端规范化内容 SHA-256 hex',
  `reviewer_user_id` bigint unsigned NOT NULL COMMENT 'JWT 管理员 users.id',
  `review_status` varchar(32) NOT NULL COMMENT 'passed|rejected|deferred',
  `review_comment` text NOT NULL COMMENT '人工审核意见',
  `reviewed_at` datetime(3) NOT NULL COMMENT '服务端审核时间',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_hs_math_review_item_time` (`item_id`,`reviewed_at`),
  KEY `idx_hs_math_review_item_status` (`item_id`,`review_status`,`reviewed_at`),
  KEY `idx_hs_math_review_reviewer` (`reviewer_user_id`,`reviewed_at`),
  CONSTRAINT `fk_hs_math_review_item` FOREIGN KEY (`item_id`) REFERENCES `hs_math_train_items` (`id`),
  CONSTRAINT `fk_hs_math_review_user` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='人工审核历史；passed≠items.status=approved；题目删除默认 RESTRICT 防误删';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hs_math_train_item_reviews`
--

LOCK TABLES `hs_math_train_item_reviews` WRITE;
/*!40000 ALTER TABLE `hs_math_train_item_reviews` DISABLE KEYS */;
INSERT INTO `hs_math_train_item_reviews` VALUES (19,109,2,'45d4ad41a3b28d829ff9fbd873fb11c212d8402b98fd8c8757314a231cf2ca72',2,'passed','通过','2026-10-25 12:09:07.858','2026-10-25 12:09:07.859'),(20,110,2,'2bcce5a12f4c7244d6afd467d2efe166304f084b5dd65cf4f7c5e88741f3131d',2,'passed','通过','2026-10-25 12:09:25.761','2026-10-25 12:09:25.761'),(21,113,2,'6ae18da351a201bdc49ce8cea554a791957a5ebc120983ff77fbbb9a7521c17b',2,'passed','通过','2026-10-25 12:09:40.982','2026-10-25 12:09:40.983'),(22,114,2,'47c92adbfda74a50af0624da8f5a684991587be763b46cdf6f629fbdce95167c',2,'passed','通过','2026-10-25 12:09:51.351','2026-10-25 12:09:51.351'),(23,115,2,'ae966a69ba8f733b20998282fc8fc17448de90c038be162f0b796080b6244f5f',2,'passed','通过','2026-10-25 12:10:00.251','2026-10-25 12:10:00.252'),(24,118,2,'97b2e41bd68ef39bd7c5bb0537b122617694e42585ebd1d02ee5559fbbf4ca83',2,'passed','通过','2026-10-25 12:10:14.551','2026-10-25 12:10:14.552'),(25,119,2,'6d21785a166e2ec2183f5503ac68bfee19d2fa5db7adefd7fba3866ee475cad4',2,'passed','通过','2026-10-25 12:10:24.521','2026-10-25 12:10:24.522'),(26,120,2,'175f2c25abcf257c33011714432e4104f6f6e598dedea7f2a821d140694c0909',2,'passed','通过','2026-10-25 12:10:35.871','2026-10-25 12:10:35.872'),(27,123,2,'0f6a522ddc935f26c04ecd40d9393ca2aeea342b69ca2bd45df3629135a30e06',2,'passed','通过','2026-10-25 12:10:50.938','2026-10-25 12:10:50.939'),(28,127,2,'0a03849773a241045c7fada17c226c3b47e9c263928d7a8d0bc74e08e9591ea8',2,'passed','通过','2026-10-25 12:11:06.338','2026-10-25 12:11:06.338'),(29,128,3,'57a3e3ea147d682a608050d0600b48ad563989cb3f0c2d21232730b53de16181',2,'passed','通过','2026-10-25 12:11:16.891','2026-10-25 12:11:16.891'),(30,133,3,'4344fe140bb1852f6bdfb059b64edec13d9f90212ddce70faf486898d47092a7',2,'passed','通过','2026-10-25 12:11:25.547','2026-10-25 12:11:25.548'),(31,151,3,'20a3416034b0555c1cebbf7d3ff0f2d8ef4d456a114ddb123248470f4351cf2c',2,'passed','通过','2026-10-25 13:55:56.019','2026-10-25 13:55:56.020');
/*!40000 ALTER TABLE `hs_math_train_item_reviews` ENABLE KEYS */;
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
