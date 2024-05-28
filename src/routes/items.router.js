import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// 아이템 생성 API
router.post("/items", async (req, res, next) => {
  try {
    const { name, health, power, price } = req.body;

    const existItem = await prisma.items.findFirst({
      where: { name },
    });
    if (existItem) {
      return res.status(409).json({ message: "이미 존재하는 아이템입니다." });
    }

    const item = await prisma.items.create({
      data: {
        name,
        health: +health,
        power: +power,
        price: +price,
      },
      select: {
        name: true,
        health: true,
        power: true,
        price: true,
      },
    });
    return res
      .status(201)
      .json({
        message: `아이템 "${item.name}" 가 추가되었습니다.`,
        data: item,
      });
  } catch (err) {}
});

// 아이템 조회 API
router.get("/items", async (req, res, next) => {
  try {
    const items = await prisma.items.findMany({
      select: {
        item_code: true,
        name: true,
        price: true,
      },
    });

    return res.status(200).json({ data: items });
  } catch (err) {}
});

// 아이템 상세조회 API
router.get("/items/:item_code", async (req, res, next) => {
  try {
    const { item_code } = req.params;

    const existItem = await prisma.items.findFirst({
      where: { item_code: +item_code },
    });
    if (!existItem) {
      return res.status(404).json({ message: "존재하지 않는 아이템입니다." });
    }
    const item = await prisma.items.findFirst({
      where: { item_code: +item_code },
      select: {
        item_code: true,
        name: true,
        health: true,
        power: true,
        price: true,
      },
    });
    return res.status(200).json({ data: item });
  } catch (err) {
    return res
      .status(404)
      .json({ message: "아이템 정보를 불러올 수 없습니다." });
  }
});
// 아이템 수정 API
router.patch("/items/:item_code", async (req, res, next) => {
  const { item_code } = req.params;
  const { name, health, power } = req.body;

  const existItem = await prisma.items.findFirst({
    where: { item_code: +item_code },
  });
  if (!existItem) {
    return res.status(404).json({ message: "존재하지 않는 아이템입니다." });
  }

  await prisma.items.update({
    where: { item_code: +item_code },
    data: {
      name,
      health: +health,
      power: +power,
    },
  });
  return res.status(200).json({ message: "아이템 정보가 수정되었습니다." });
});

export default router;
