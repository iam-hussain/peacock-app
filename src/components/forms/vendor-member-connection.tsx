"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type MemberConnection = {
    id: string;
    member: { firstName: string; lastName: string };
    active: boolean;
};

type VendorMemberConnectionsFormProps = {
    vendorId: string;
};

export function VendorMemberConnectionsForm({ vendorId }: VendorMemberConnectionsFormProps) {
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
        } catch (error) {
            toast.error("Failed to update connections");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-medium">Manage Member Connections</h2>

            {connections.map((connection, index) => (
                <div key={connection.id} className="flex items-center justify-between">
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

            <Button type="submit" className="w-full">
                Save Changes
            </Button>
        </form>
    );
}
