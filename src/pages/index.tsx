import Layout from "@/components/Layout";
import { createUseRoute, createUseRouteMutation } from "@/lib/swr";
import { createEvent, readEvents } from "@/types/event";
import {
  Item,
  createItem,
  deleteItem,
  readItems,
  updateItem,
} from "@/types/item";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { useState } from "react";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import { useRouter } from "next/router";
import type { GetServerSidePropsContext } from "next";
import { verify } from "@/lib/auth";

export async function getServerSideProps({ req }: GetServerSidePropsContext) {
  const token = await verify(req);
  if (!token) return { props: {} };

  const [events, items] = await prisma.$transaction([
    prisma.event.findMany({ include: eventInclude }),
    prisma.item.findMany({ orderBy: { code: "asc" } }),
  ]);

  return {
    props: {
      fallback: {
        "/api/users/me": token,
        "/api/events": events.map(toEvent),
        "/api/items": items,
      },
    },
  };
}

const useEvents = createUseRoute(readEvents);
const useItems = createUseRoute(readItems);

export default function Home() {
  const { data: events } = useEvents();
  const { data: items } = useItems();
  const router = useRouter();

  const [openItem, setOpenItem] = useState<Item>();

  return (
    <Layout headTitle="Kiradopay - トップ" bodyTitle="Kiradopay">
      <Box sx={{ display: "flex", flexDirection: "row", my: 2 }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          イベント
        </Typography>
        <CreateEvent />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "center",
          rowGap: 2,
          columnGap: 2,
          mx: 2,
        }}
      >
        {events?.map((event) => (
          <Card key={event.code}>
            <CardActionArea onClick={() => router.push(`/${event.code}`)}>
              <CardContent
                sx={{
                  textAlign: "center",
                  textTransform: "none",
                  fontSize: "1.5em",
                  fontWeight: "bold",
                }}
              >
                {event.name}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row", my: 2 }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          商品
        </Typography>
        <CreateItem />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          alignItems: "center",
          rowGap: 2,
          columnGap: 2,
          mx: 2,
        }}
      >
        {items?.map((item) => (
          <Card key={item.code}>
            <CardActionArea onClick={() => setOpenItem(item)} sx={{ p: 2 }}>
              <CardMedia
                component="img"
                image={item.picture}
                alt={item.name}
                sx={{ maxWidth: 200 }}
              />
              <CardContent sx={{ textAlign: "center", textTransform: "none" }}>
                <Box sx={{ fontSize: "1.5em", fontWeight: "bold" }}>
                  {item.name}
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
      {openItem && (
        <MutateItem item={openItem} onClose={() => setOpenItem(undefined)} />
      )}
    </Layout>
  );
}

const useCreateEvent = createUseRouteMutation(createEvent);
const createEventBody = TypeCompiler.Compile(createEvent.body);

function CreateEvent() {
  const { trigger, isMutating } = useCreateEvent();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString());

  const body = { code, name, date: new Date(date) };
  const isValid = createEventBody.Check(body);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Add />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>イベントを作成</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            rowGap: 1,
          }}
        >
          <TextField
            label="イベントコード"
            variant="standard"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <TextField
            label="イベント名"
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="日付"
            type="date"
            variant="standard"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={isMutating || !isValid}
            onClick={async (e) => {
              e.preventDefault();
              if (!isValid) return;
              await trigger(body);
              setOpen(false);
            }}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const useCreateItem = createUseRouteMutation(createItem);
const createItemBody = TypeCompiler.Compile(createItem.body);

function CreateItem() {
  const { trigger, isMutating } = useCreateItem();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [picture, setPicture] = useState("");

  const body = { code, name, picture };
  const isValid = createItemBody.Check(body);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Add />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>商品を作成</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            rowGap: 2,
          }}
        >
          <DialogContentText></DialogContentText>
          <TextField
            label="商品コード"
            variant="standard"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <TextField
            label="商品名"
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="画像URL"
            variant="standard"
            value={picture}
            onChange={(e) => setPicture(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={isMutating || !isValid}
            onClick={async (e) => {
              e.preventDefault();
              if (!isValid) return;
              await trigger(body);
              setOpen(false);
            }}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const useUpdateItem = createUseRouteMutation(updateItem);
const updateItemBody = TypeCompiler.Compile(updateItem.body);

const useDeleteItem = createUseRouteMutation(deleteItem);

function MutateItem({ item, onClose }: { item: Item; onClose: () => void }) {
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateItem({
    itemcode: item.code,
  });
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteItem({
    itemcode: item.code,
  });

  const [code, setCode] = useState<string>();
  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>();

  const body = { code, name, picture };
  const isValid = updateItemBody.Check(body);

  return (
    <Dialog open={Boolean(item)} onClose={onClose}>
      <DialogTitle>商品を編集</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          rowGap: 2,
        }}
      >
        <DialogContentText></DialogContentText>
        <TextField
          label="商品コード"
          variant="standard"
          value={code ?? item?.code}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label="商品名"
          variant="standard"
          value={name ?? item?.name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="画像URL"
          variant="standard"
          value={picture ?? item?.picture}
          onChange={(e) => setPicture(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          type="submit"
          variant="contained"
          disabled={isUpdating || isDeleting || !isValid}
          onClick={async (e) => {
            e.preventDefault();
            if (!isValid) return;
            await triggerUpdate(body);
            onClose();
          }}
        >
          更新
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isUpdating || isDeleting}
          onClick={async (e) => {
            e.preventDefault();
            await triggerDelete(null);
            onClose();
          }}
        >
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
