import type { NextApiRequest, NextApiResponse } from "next";
import { verify } from "@/lib/auth";
import { createHandler } from "@/lib/handler";
import { prisma } from "@/lib/prisma";
import { createReceipts, readReceipts } from "@/types/receipt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      await readReceiptsHandler(req, res);
      break;
    case "POST":
      await createReceiptsHandler(req, res);
      break;
    case "HEAD":
      res.status(200).end();
      break;
    default:
      res.status(405).end();
      break;
  }
}

const readReceiptsHandler = createHandler(readReceipts, async (req, res) => {
  const token = verify(req, ["read"]);
  if (!token) {
    res.status(401).end();
    return;
  }

  const receipts = await prisma.receipt.findMany({
    where: { eventcode: req.query.eventcode },
    include: { records: true },
  });

  res.status(200).json(receipts);
});

const createReceiptsHandler = createHandler(
  createReceipts,
  async (req, res) => {
    const token = verify(req, ["write"]);
    if (!token) {
      res.status(401).end();
      return;
    }

    const { eventcode } = req.query;
    const receipts = await prisma.$transaction(
      req.body.map(({ records, ...rest }) =>
        prisma.receipt.create({
          data: {
            ...rest,
            eventcode,
            userId: token.id,
            records: {
              create: records.map(({ itemcode, ...rest }, index) => ({
                ...rest,
                index,
                display: {
                  connect: {
                    eventcode_itemcode: {
                      eventcode,
                      itemcode,
                    },
                  },
                },
              })),
            },
          },
          include: { records: true },
        })
      )
    );

    res.status(200).json(receipts);
  }
);
