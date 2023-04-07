import { useAlert } from "@/components/Alert";
import EventCard from "@/components/EventCard";
import EventDialog from "@/components/EventDialog";
import ItemCard from "@/components/ItemCard";
import Layout from "@/components/Layout";
import { verify } from "@/lib/auth";
import { eventInclude, prisma, toEvent } from "@/lib/prisma";
import {
  ConflictError,
  useEvent,
  useItems,
  useTitle,
  useUpdateEvent,
} from "@/lib/swr";
import { UpdateEvent } from "@/types/event";
import type { Item as ItemSchema } from "@/types/item";
import Edit from "@mui/icons-material/Edit";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { compressToEncodedURIComponent } from "lz-string";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

export async function getServerSideProps({
  req,
  params,
}: GetServerSidePropsContext<{ eventcode: string }>) {
  const token = verify(req);
  if (!token) return { props: {} };

  const { eventcode } = params!;
  const event = await prisma.event.findUnique({
    where: { code: eventcode },
    include: eventInclude,
  });

  if (!event) return { notFound: true };

  return {
    props: {
      fallback: {
        "/api/users/me": token,
        [`/api/events/${eventcode}`]: toEvent(event),
      },
    },
  };
}

export default function EventWrapper() {
  const router = useRouter();
  const { eventcode } = router.query;
  if (typeof eventcode !== "string") return null;

  return <Event eventcode={eventcode} />;
}

function isValidCalculator(calculator: string) {
  try {
    new Function("state", calculator);
    return true;
  } catch {
    return false;
  }
}

function Event({ eventcode }: { eventcode: string }) {
  const title = useTitle(eventcode);

  return (
    <Layout title={title} back="/">
      <About eventcode={eventcode} />
      <UpdateCalculator eventcode={eventcode} />
      <Display eventcode={eventcode} />
    </Layout>
  );
}

function About({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const { trigger, isMutating } = useUpdateEvent({ eventcode });
  const router = useRouter();
  const { error, success } = useAlert();
  const [open, setOpen] = useState(false);

  async function onClick(body: UpdateEvent) {
    try {
      await trigger(body);
      success("イベントを更新しました");
      setOpen(false);
    } catch (e) {
      if (e instanceof ConflictError) error("イベントコードが重複しています");
      else error("イベントの更新に失敗しました");
      throw e;
    }
  }

  if (!event) return null;
  return (
    <>
      <Box sx={{ my: 2, display: "flex", flexDirection: "row", columnGap: 2 }}>
        <EventCard event={event} onClick={() => setOpen(true)} />
        <Button
          variant="contained"
          onClick={() => router.push(`/${event.code}/register`)}
        >
          レジを起動
        </Button>
        <Button
          variant="contained"
          onClick={() => router.push(`/${event.code}/receipts`)}
        >
          購入履歴
        </Button>
      </Box>
      <EventDialog
        schema={UpdateEvent}
        title="イベントを更新"
        event={event}
        open={open}
        onClose={() => setOpen(false)}
        isMutating={isMutating}
        buttons={[
          { label: "更新", needsValidation: true, needsUpdate: true, onClick },
        ]}
      />
    </>
  );
}

function playground(items: ItemSchema[]) {
  return `\
type Itemcode = ${items.map((item) => `"${item.code}"`).join(" | ") || "never"};

interface RecordState {
  count: number;
  dedication?: boolean;
}

type State = {
  [K in Itemcode]: RecordState;
}

function calculate(state: State): number {
  return 0;
}
`;
}

function UpdateCalculator({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const { trigger, isMutating } = useUpdateEvent({ eventcode });
  const { error, success } = useAlert();
  const defaultCalculator = event?.calculator || "return 0";
  const [calculator, setCalculator] = useState<string>(defaultCalculator);

  const hash = useMemo(
    () =>
      event?.items && compressToEncodedURIComponent(playground(event.items)),
    [event?.items]
  );

  async function onClick() {
    try {
      await trigger({ calculator });
      success("計算機を更新しました");
    } catch (e) {
      error("計算機の更新に失敗しました");
      throw e;
    }
  }

  return (
    <>
      <Box sx={{ my: 2, display: "flex", flexDirection: "row", columnGap: 2 }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          計算機
        </Typography>
        <Button
          variant="outlined"
          sx={{ textTransform: "none" }}
          href={`https://www.typescriptlang.org/play?#code/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          TS Playground
        </Button>
        <LoadingButton
          variant="contained"
          loading={isMutating}
          disabled={
            calculator === defaultCalculator || !isValidCalculator(calculator)
          }
          onClick={onClick}
        >
          更新
        </LoadingButton>
      </Box>
      <Box
        sx={{
          width: "100%",
          m: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {"function calculate(state) {"}
        <TextField
          variant="outlined"
          sx={{ px: 2, width: "100%" }}
          value={calculator ?? defaultCalculator}
          error={calculator !== undefined && !isValidCalculator(calculator)}
          multiline
          onChange={(e) => setCalculator(e.target.value)}
        />
        {"}"}
      </Box>
    </>
  );
}

function Display({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <Typography variant="h2" sx={{ fontSize: "2em" }}>
          お品書き
        </Typography>
        <IconButton
          color="primary"
          sx={{ m: "1em" }}
          onClick={() => setOpen(true)}
        >
          <Edit />
        </IconButton>
      </Box>
      <Grid container spacing={2}>
        {event?.items.map((item) => (
          <Grid item key={item.code}>
            <ItemCard item={item} />
          </Grid>
        ))}
      </Grid>
      <DisplayDialog
        eventcode={eventcode}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function DisplayDialog({
  eventcode,
  open,
  onClose,
}: {
  eventcode: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: event } = useEvent({ eventcode });
  const { data: items } = useItems();
  const { trigger, isMutating } = useUpdateEvent({ eventcode });
  const { error, success } = useAlert();
  const defaultDisplays = event?.items.map((i) => i.code) || [];
  const [displays, setDisplays] = useState(defaultDisplays);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>お品書きを編集</DialogTitle>
      <DialogContent>
        <DialogContentText></DialogContentText>
        {items?.map((item) => (
          <Box key={item.code} sx={{ display: "flex", alignItems: "center" }}>
            <Typography>{item.name}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Switch
              key={item.code}
              checked={displays.some((code) => code === item.code)}
              onChange={(e) => {
                if (e.target.checked) setDisplays([...displays, item.code]);
                else setDisplays(displays.filter((i) => i !== item.code));
              }}
              disabled={isMutating}
            />
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <LoadingButton
          onClick={async () => {
            try {
              await trigger({ items: displays });
              success("お品書きを更新しました");
              onClose();
            } catch (e) {
              if (e instanceof ConflictError)
                error("この商品はすでに購入されています");
              else error("お品書きの更新に失敗しました");
              throw e;
            }
          }}
          loading={isMutating}
          disabled={
            [...displays].sort().toString() ===
            [...defaultDisplays].sort().toString()
          }
        >
          更新
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
