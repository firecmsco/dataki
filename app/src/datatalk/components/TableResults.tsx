import { useEffect, useMemo, useState } from "react";
import {
    CollectionSize,
    copyEntityAction,
    deleteEntityAction,
    editEntityAction,
    Entity,
    EntityAction,
    EntityCollection,
    EntityCollectionRowActions,
    EntityCollectionTable,
    PropertiesOrBuilders,
    resolveCollection,
    useSelectionController
} from "@firecms/core";
import { firestoreToCMSModel } from "@firecms/firebase";
import { Typography } from "@firecms/ui";
import { BasicExportAction } from "@firecms/data_import_export";
import { getPropertiesFromData } from "@firecms/collection_editor_firebase";
import { buildPropertiesOrder } from "@firecms/schema_inference";

export function TableResults({
                                 data,
                                 priorityKeys,
                                 collections
                             }: {
    data: object[],
    priorityKeys?: string[],
    collections?: EntityCollection[]
}) {

    async function inferProperties() {
        if (data.length === 0) {
            return;
        }
        let foundProperties = null;
        let foundPropertiesOrder;

        foundProperties = await getPropertiesFromData(data);
        foundPropertiesOrder = buildPropertiesOrder(foundProperties, foundPropertiesOrder, priorityKeys);

        setProperties(foundProperties);
        setPropertiesOrder(foundPropertiesOrder)
    }

    useEffect(() => {
        inferProperties();
    }, []);

    const [properties, setProperties] = useState<PropertiesOrBuilders | null>(null);
    const [propertiesOrder, setPropertiesOrder] = useState<string[] | null>(null);
    const [path, setPath] = useState<string | null>(null);
    const [collection, setCollection] = useState<EntityCollection | undefined>();

    const resolvedCollection = useMemo(() => {
        return collection && path ? resolveCollection<any>({
                collection,
                path,
            })
            : undefined;
    }, [collection, path]);

    const selectionController = useSelectionController();
    const displayedColumnIds = (propertiesOrder ?? Object.keys(properties ?? {}))
        .map((key) => ({
            key,
            disabled: false
        }));


    if (!data || !properties) return null;

    const getActionsForEntity = ({
                                     entity,
                                     customEntityActions
                                 }: {
        entity?: Entity<any>,
        customEntityActions?: EntityAction[]
    }): EntityAction[] => {
        const actions: EntityAction[] = [editEntityAction];
        actions.push(copyEntityAction);
        actions.push(deleteEntityAction);
        if (customEntityActions)
            actions.push(...customEntityActions);
        return actions;
    };

    const tableRowActionsBuilder = ({
                                        entity,
                                        size,
                                        width,
                                        frozen
                                    }: {
        entity: Entity<any>,
        size: CollectionSize,
        width: number,
        frozen?: boolean
    }) => {

        const actions = getActionsForEntity({
            entity,
            customEntityActions: resolvedCollection?.entityActions
        });

        const path = entity.path.split("/").slice(0, -1).join("/");
        return (
            <EntityCollectionRowActions
                entity={entity}
                width={width}
                frozen={frozen}
                selectionEnabled={false}
                size={size}
                collection={resolvedCollection ?? undefined}
                fullPath={path}
                actions={actions}
                hideId={resolvedCollection?.hideIdFromCollection}
            />
        );

    };

    return <EntityCollectionTable
        inlineEditing={true}
        defaultSize={"s"}
        selectionController={selectionController}
        filterable={false}
        actionsStart={<Typography
            variant={"caption"}>
            {(data ?? []).length} results
        </Typography>}
        actions={<BasicExportAction
            data={data}
            properties={properties}
            propertiesOrder={propertiesOrder ?? undefined}
        />}
        enablePopupIcon={false}
        sortable={false}
        tableRowActionsBuilder={tableRowActionsBuilder}
        tableController={{
            data: data,
            dataLoading: false,
            noMoreToLoad: true
        }}
        displayedColumnIds={displayedColumnIds}
        properties={properties}/>;
}
