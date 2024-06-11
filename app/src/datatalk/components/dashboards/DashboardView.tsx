import { Dashboard } from "../../types";
import React, { useDeferredValue, useEffect, useRef } from "react";
import { DashboardPageView } from "./DashboardPageView";
import { TextField } from "@firecms/ui";
import { useDataTalk } from "../../DataTalkProvider";
import { useResizeObserver } from "../../utils/useResizeObserver";

export function DashboardView({ dashboard }: { dashboard: Dashboard }) {

    const {
        id,
        title,
        description,
        pages
    } = dashboard;

    const [selectedPageId, setSelectedPageId] = React.useState(pages[0].id);

    const ref = useRef<HTMLDivElement>(null);
    const size = useResizeObserver(ref);
    const selectedPage = pages.find(page => page.id === selectedPageId);

    return (
        <div ref={ref} className={"relative w-full h-full flex flex-col"}>
            {size && selectedPage &&
                <DashboardPageView page={selectedPage} dashboard={dashboard} containerSize={size}/>}
        </div>
    );

}

export function DashboardNameTextField({
                                           title: titleProp,
                                           id
                                       }: { title?: string, id: string }) {
    const dataTalk = useDataTalk();
    const savedTitle = useRef(titleProp);
    const [title, setTitle] = React.useState(titleProp);
    const deferredTitle = useDeferredValue(title);
    useEffect(() => {
        if (deferredTitle !== savedTitle.current) {
            dataTalk.updateDashboard(id, { title: deferredTitle });
            savedTitle.current = deferredTitle;
        }
    }, [deferredTitle]);
    return (
        <TextField
            className={"font-semibold rounded-xl text-sm"}
            invisible={true}
            size={"smallest"}
            placeholder={"Untitled dashboard"}
            onChange={(e) => setTitle(e.target.value)}
            value={title}
        />
    );
}
