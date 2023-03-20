import Layout from "@/components/Layout";
import { useIDBReceipts } from "@/lib/idb";
import { createUseRoute } from "@/lib/swr";
import { Event, readEvent } from "@/types/event";
import { readReceipts, Receipt } from "@/types/receipt";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function ReceiptsWrapper() {
  const router = useRouter();
  const { eventcode } = router.query;
  if (typeof eventcode !== "string") return null;

  return <Receipts eventcode={eventcode} />;
}

function Receipts({ eventcode }: { eventcode: string }) {
  const { data: event } = useEvent({ eventcode });
  const title = event ? event.name : eventcode;

  return (
    <Layout
      headTitle={`${title} | Kiradopay`}
      bodyTitle={title}
      back={`/${eventcode}`}
    >
      {event && <ReceiptTable event={event} />}
    </Layout>
  );
}

const useEvent = createUseRoute(readEvent);
const useReceipts = createUseRoute(readReceipts);

const basicColumns: GridColDef[] = [
  {
    field: "createdAt",
    headerName: "時刻",
    width: 160,
    valueGetter: ({ value }) => value.toLocaleString("ja-JP"),
  },
  { field: "total", headerName: "合計", width: 90, align: "right" },
  { field: "onServer", headerName: "同期", width: 90, align: "center" },
];

function flat(receipt: Receipt, onServer: boolean) {
  const { records, createdAt, ...rest } = receipt;
  return {
    ...rest,
    createdAt: new Date(createdAt),
    onServer,
    ...Object.fromEntries(
      records.map(({ itemcode, count }) => [itemcode, count])
    ),
  };
}

function ReceiptTable({ event }: { event: Event }) {
  const { data: onServer } = useReceipts({ eventcode: event.code });
  const { data: onBrowser } = useIDBReceipts(event.code);
  const columns = useMemo(
    () => [
      ...basicColumns,
      ...event.items.map<GridColDef>(({ code, name }) => ({
        field: code,
        headerName: name,
        width: 160,
        align: "right",
      })),
    ],
    [event.items]
  );
  const rows = useMemo(
    () => [
      ...(onServer || []).map((receipt) => flat(receipt, true)),
      ...(onBrowser || []).map((receipt) => flat(receipt, false)),
    ],
    [onServer, onBrowser]
  );

  return <DataGrid rows={rows} columns={columns} />;
}
