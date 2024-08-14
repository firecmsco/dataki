import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, Typography } from "@firecms/ui";

export interface ConfirmationDialogProps {
    title?: string;
    confirmMessage: string;
    onAccept: () => void;
}

export const useConfirmationDialog = ({
                                          title = "Confirm",
                                          confirmMessage,
                                          onAccept
                                      }: ConfirmationDialogProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const open = () => {
        setIsDialogOpen(true);
    }

    const ConfirmationDialog = <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open ? setIsDialogOpen(false) : undefined}
    >
        <DialogContent>
            <Typography variant={"h6"} className={"mb-2"}>{title}</Typography>
            {confirmMessage}
        </DialogContent>

        <DialogActions>
            <Button
                variant={"text"}
                onClick={() => setIsDialogOpen(false)}
                autoFocus>
                Cancel
            </Button>

            <Button
                color="primary"
                type="submit"
                onClick={() => {
                    onAccept();
                    setIsDialogOpen(false);
                }}>
                Ok
            </Button>
        </DialogActions>
    </Dialog>

    return {
        open,
        isDialogOpen,
        ConfirmationDialog
    };
};
