"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GenericModalFooter } from "../generic-modal";
import Box from "../ui/box";

type MemberConnection = {
    id: string;
    member: { firstName: string; lastName: string };
    active: boolean;
};

type VendorMemberConnectionsFormProps = {
    vendorId: string;
    onSuccess: () => void
    onCancel?: () => void
};

export function VendorMemberConnectionsForm({ vendorId, onSuccess, onCancel }: VendorMemberConnectionsFormProps) {
    const { control, handleSubmit, reset } = useForm();
    const [connections, setConnections] = useState<MemberConnection[]>([]);

    useEffect(() => {
        async function fetchConnections() {
            const response = await fetch(`/api/vendor-profit-share/vendor/${vendorId}`);
            const data = await response.json();
            setConnections(data.connections);
            reset({ connections: data.connections });
        }

        fetchConnections();
    }, [vendorId, reset]);

    const onSubmit = async (data: any) => {
        try {
            const response = await fetch(`/api/vendor-profit-share/vendor/${vendorId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data.connections),
            });

            if (!response.ok) throw new Error("Failed to update connections");

            toast.success("Connections updated successfully");
            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            toast.error("Failed to update connections");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {connections.length === 0 && <p className="w-full text-center p-6">Loading...</p>}
            <Box preset={'grid-split'} className="gap-0">
                {connections.map((connection, index) => (
                    <div key={connection.id} className="flex items-center justify-between border p-2 rounded-md">
                        <span>{`${connection.member.firstName} ${connection.member.lastName}`}</span>
                        <Controller
                            name={`connections.${index}.active`}
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    defaultChecked={connection.active}
                                />
                            )}
                        />
                    </div>
                ))}
            </Box>
            <GenericModalFooter actionLabel={"Save Changes"} onCancel={onCancel} />
        </form>
    );
}
