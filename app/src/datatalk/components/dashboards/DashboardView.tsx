import { Dashboard, Position } from "../../types";
import React, { useRef } from "react";
import { DashboardPageView } from "./DashboardPageView";
import { useResizeObserver } from "../../utils/useResizeObserver";

export function DashboardView({
                                  dashboard,
                                  initialViewPosition
                              }: {
    dashboard: Dashboard,
    initialViewPosition?: Position
}) {

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
                <DashboardPageView page={selectedPage}
                                   dashboard={dashboard}
                                   containerSize={size}
                                   initialViewPosition={initialViewPosition}
                />}
        </div>
    );

}
