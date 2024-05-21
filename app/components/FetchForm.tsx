"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import { pingAction } from "@/app/server/ping";

export default function FetchForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(
    (_: unknown, payload: FormData) =>
      pingAction(JSON.stringify(Object.fromEntries(payload.entries()))),
    null
  );

  return (
    <form
      ref={formRef}
      action={formAction}
    >
      <input
        className="px-3 py-1.5 rounded border mb-2 w-full bg-transparent border-white/50 placeholder:text-white/50 focus:outline-none focus:ring-[3px]"
        placeholder="IP to ping"
        name="ip"
        id="ip"
        type="text"
        required
      />

      {state && [
        ...state.conversations.map((conv) => (
          <div
            key={conv.icmpSeq}
            className="flex items-center justify-between bg-gray-900 p-2 my-2 bg-opacity-50 rounded"
          >
            <div className="text-sm m-2">
              <div className="rounded-full w-5 h-5 bg-green-500 text-center">
                <code>{conv.icmpSeq}</code>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-semibold">TTL: </span>
              <span>{conv.ttl}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Time: </span>
              <span>{conv.time}</span>
            </div>
          </div>
        )),
        <div className="flex items-center justify-between p-2 my-2 rounded">
          <div className="text-sm">
            <span className="font-semibold">Packets Transmitted: </span>
            {state.statistics.transmitted}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Received: </span>
            {state.statistics.received}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Loss:</span> {state.statistics.loss}
          </div>
        </div>,
      ]}

      <button
        type="submit"
        className="bg-blue-500 hover:shadow-lg transition duration-200 text-white font-semibold px-4 py-2 rounded"
      >
        Submit ping request
      </button>
    </form>
  );
}
