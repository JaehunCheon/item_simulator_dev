import express, { application } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

//캐릭터 생성 API
router.post("/create", authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.body;
    const { userId } = req.user;

    const existCharacter = await prisma.characters.findFirst({
      where: { name },
    });
    if (existCharacter) {
      return res.status(409).json({ message: "이미 존재하는 이름입니다." });
    }

    const character = await prisma.characters.create({
      data: {
        name,
        UserId: +userId,
      },
    });
    return res
      .status(201)
      .json({ message: "캐릭터를 생성했습니다.", data: character });
  } catch (err) {
    console.error("캐릭터 등록에 실패했습니다.", err);
    return res.status(404).json({ message: "캐릭터 등록에 실패했습니다." });
  }
});
// 캐릭터 삭제 API
router.delete("/:name", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = req.params;

    const existCharacter = await prisma.characters.findUnique({
      where: { name },
    });
    if (!existCharacter) {
      return res
        .status(404)
        .json({ message: "해당 캐릭터를 찾을 수 없습니다." });
    }

    await prisma.characters.delete({
      where: {
        UserId: +userId,
        name,
      },
    });

    return res.status(201).json({ message: "캐릭터가 삭제되었습니다." });
  } catch (err) {
    console.error("캐릭터 삭제에 실패했습니다.", err);
    return res.status(400).json({ message: "권한이 없습니다." });
  }
});

// 캐릭터 상세 조회 API
router.get("/:characterId", authMiddleware, async (req, res, next) => {
  try {
    const { characterId } = req.params; // 캐릭터 이름으로 조회.
    const { userId } = req.user;

    let character;
    if (userId) {
      character = await prisma.characters.findFirst({
        where: {
          characterId: +characterId,
          UserId: +userId,
        },
        select: {
          name: true,
          health: true,
          power: true,
          money: true,
        },
      });
    }
    if (!character) {
      character = await prisma.characters.findFirst({
        where: { characterId: +characterId },
        select: {
          name: true,
          health: true,
          power: true,
        },
      });
    }

    if (character) {
      return res.status(200).json({ data: character });
    } else {
      return res.status(404).json({ message: "캐릭터를 찾을 수 없습니다." });
    }
  } catch (err) {
    return res.status(500).json({ message: "캐릭터 조회 실패" });
  }
});

export default router;
