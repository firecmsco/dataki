import React, { useEffect } from "react";
import { DatakiConfig } from "../DatakiProvider";
import { CircularProgressCenter, EntityCollection } from "@firecms/core";
import { useLocation, useParams } from "react-router-dom";
import { Dashboard, Position } from "../types";
import { DashboardView } from "../components/dashboards/DashboardView";

export function DashboardRoute({
                                   datakiConfig,
                                   onAnalyticsEvent,
                               }: {
    datakiConfig: DatakiConfig,
    onAnalyticsEvent?: (event: string, params?: any) => void,
}) {

    const { dashboardId } = useParams();
    if (!dashboardId) throw Error("Dashboard id not found");

    return <DashboardRouteInner
        key={dashboardId}
        dashboardId={dashboardId}
        datakiConfig={datakiConfig}
        onAnalyticsEvent={onAnalyticsEvent}/>
}

interface DashboardRouteInnerProps {
    dashboardId: any;
    datakiConfig: DatakiConfig;
    onAnalyticsEvent?: (event: string, params?: any) => void,
    collections?: EntityCollection[]
}

function DashboardRouteInner({
                                 dashboardId,
                                 datakiConfig,
                                 onAnalyticsEvent,
                             }: DashboardRouteInnerProps) {

    const location = useLocation();

    const initialViewPosition = location.state?.initialViewPosition as Position | undefined;

    const params = new URLSearchParams(location.search);

    const [dashboard, setDashboard] = React.useState<Dashboard | undefined>(undefined);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        setLoading(true);
        return datakiConfig.listenDashboard(dashboardId, (dashboard) => {
            setDashboard(dashboard);
            setLoading(false);
        });
    }, [dashboardId]);

    if (loading) {
        return <CircularProgressCenter/>
    }

    if (!dashboard) {
        return <div>Dashboard not found</div>
    }

    return (
        <DashboardView
            dashboard={dashboard}
            initialViewPosition={initialViewPosition}
        />
    )
}
