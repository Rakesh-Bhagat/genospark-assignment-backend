/*
  Warnings:

  - The values [User] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('Admin', 'Editor') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
