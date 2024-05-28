// src/routes/users.router.js
import bcrypt from "bcrypt";
import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import validateID from "../middlewares/validateID.middleware.js";
import validatePassword from "../middlewares/validatePassword.middleware.js";
import characterRouter from "./characters.router.js";


const router = express.Router();

/** 사용자 회원가입 API **/
router.post(
  "/sign-up",
  validateID,
  validatePassword,
  async (req, res, next) => {
    try {
      const { ID, password, name, age, gender, profileImage } = req.body;

      const isExistUser = await prisma.users.findFirst({
        where: {
          ID,
        },
      });

      if (isExistUser) {
        return res.status(409).json({ message: "이미 존재하는 이름입니다." });
      }

      // Users 테이블에 사용자를 추가합니다.
      const hashedPassword = await bcrypt.hash(password, 10);

      const [user, userInfo] = await prisma.$transaction(
        async (tx) => {
          const user = await tx.users.create({
            data: {
              ID,
              password: hashedPassword,
            },
          });
          // UserInfos 테이블에 사용자 정보를 추가합니다.
          const userInfo = await tx.userInfos.create({
            data: {
              UserId: user.userId, // 생성한 유저의 userId를 바탕으로 사용자 정보를 생성합니다.
              name,
              age,
              gender: gender.toUpperCase(), // 성별을 대문자로 변환합니다.
              profileImage,
            },
          });
          return [user, userInfo];
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );
      return res.status(201).json({ message: "회원가입이 완료되었습니다." });
    } catch (err) {
      next(err);
    }
  }
);

// 로그인 API
router.post("/sign-in", async (req, res, next) => {
  const { ID, password } = req.body;

  const user = await prisma.users.findFirst({ where: { ID } });
  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 유저입니다." });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const token = jwt.sign(
    {
      userId: user.userId,
    },
    process.env.JWT_SECRET
  );

  // authotization 쿠키에 Berer 토큰 형식으로 JWT를 저장합니다.
  res.cookie("authorization", `Bearer ${token}`);

  return res.status(200).json({ message: "로그인 성공했습니다." });
});

// 사용자 조회 API
router.get("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      ID: true,
      createdAt: true,
      updatedAt: true,
      UserInfos: {
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

// 사용자 정보 변경 API
router.patch("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const updatedData = req.body;
  const userInfo = await prisma.userInfos.findFirst({
    where: { UserId: +userId },
  });

  await prisma.$transaction(
    async (tx) => {
      await tx.userInfos.update({
        data: { ...updatedData },
        where: { UserId: +userId },
      });
      for (let key in updatedData) {
        if (userInfo[key] !== updatedData[key]) {
          await tx.userHistories.create({
            data: {
              UserId: +userId,
              changedField: key,
              oldValue: String(userInfo[key]),
              newValue: String(updatedData[key]),
            },
          });
        }
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );

  return res.status(200).json({ message: "사용자 정보 변경에 성공했습니다." });
});

router.use("/characters", characterRouter);

export default router;
