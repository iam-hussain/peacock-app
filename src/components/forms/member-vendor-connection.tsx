"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type VendorConnection = {
    id: string;
    vendor: { name: string };
    active: boolean;
};

type MemberVendorConnectionsFormProps = {
    memberId: string;
};

export function MemberVendorConnectionsForm({ memberId }: MemberVendorConnectionsFormProps) {
    const { control, handleSubmit, reset } = useForm();
    const [connections, setConnections] = useState<VendorConnection[]>([]);

    useEffect(() => {
        async function fetchConnections() {
            const response = await fetch(`/api/vendor-profit-share/member/${memberId}`);
            const data = await response.json();
            console.log({ data })
            setConnections(data.connections);
            reset({ connections: data.connections });
        }

        fetchConnections();
    }, [memberId, reset]);

    const onSubmit = async (data: any) => {
        try {
            const response = await fetch(`/api/vendor-profit-share/member/${memberId}`, {
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
            <h2 className="text-lg font-medium">Manage Vendor Connections</h2>

            {connections.map((connection, index) => (
                <div key={connection.id} className="flex items-center justify-between">
                    <span>{connection.vendor.name}</span>
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
