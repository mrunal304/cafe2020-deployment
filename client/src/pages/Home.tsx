import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Users, Phone, User, ArrowRight, Loader2 } from "lucide-react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateQueueEntry } from "@/hooks/use-queue";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(1, "Name is helpful!"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
  numberOfPeople: z.coerce.number().min(1, "At least 1 person"),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate: joinQueue, isPending } = useCreateQueueEntry();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      numberOfPeople: 0 as any,
    },
  });

  const onSubmit = (data: FormData) => {
    joinQueue(data, {
      onSuccess: (entry) => {
        // Use entry.position for real-time queue position
        // The popup and main card must show the same position.
        const position = entry.position || entry.queueNumber;
        console.log("=== POPUP DEBUG ===");
        console.log("Queue position being displayed in popup:", position);
        console.log("Entry data:", entry);
        console.log("==================");
        toast({
          title: "Welcome to the queue!",
          description: `You are #${position} in line.`,
        });
        setLocation(`/queue/${entry.id}`);
      },
      onError: (err) => {
        toast({
          title: "Could not join queue",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <CustomerLayout>
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-display text-[var(--text-dark)]">Join the Queue</h2>
          <p className="text-[var(--text-muted)] mt-2">Get in line from anywhere. We'll text you when your table is ready.</p>
        </div>

        <div className="bg-[var(--beige)]/95 p-6 rounded-2xl shadow-xl border border-white/20">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-dark)] flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--terracotta)]" />
                  Your Name
                </label>
                <Input
                  {...form.register("name")}
                  placeholder="e.g. Alex"
                  className="bg-[var(--input-bg)] border-[var(--input-border)] focus:ring-[var(--brown-primary)] focus:border-[var(--brown-primary)] h-12 text-lg rounded-xl"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs font-medium">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-dark)] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--terracotta)]" />
                  Mobile Number
                </label>
                <Input
                  {...form.register("phoneNumber")}
                  type="tel"
                  placeholder="e.g. 9876543210"
                  className="bg-[var(--input-bg)] border-[var(--input-border)] focus:ring-[var(--brown-primary)] focus:border-[var(--brown-primary)] h-12 text-lg rounded-xl tracking-wider"
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    if (val.length <= 10) {
                      form.setValue("phoneNumber", val);
                    }
                  }}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-destructive text-xs font-medium">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Party Size Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-dark)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--terracotta)]" />
                  Party Size
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => form.setValue("numberOfPeople", num)}
                      className={`
                        py-3 rounded-xl font-bold text-lg transition-all duration-200
                        ${form.watch("numberOfPeople") === num 
                          ? "bg-[var(--brown-primary)] text-white shadow-lg shadow-[var(--brown-primary)]/30 scale-105" 
                          : "bg-[var(--off-white)] text-[var(--text-muted)] hover:bg-[var(--beige)]"}
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={form.watch("numberOfPeople") || ''}
                  min="1"
                  placeholder="e.g. 8 (or select above)"
                  className="
                    w-full text-center py-3 px-4 h-12
                    border-2 border-[var(--terracotta)] rounded-xl 
                    bg-[var(--input-bg)] text-[var(--text-dark)] text-lg
                    placeholder:text-[var(--text-muted)]/50 placeholder:text-base placeholder:font-normal
                    focus:outline-none focus:ring-2 focus:ring-[var(--brown-primary)]
                  "
                  onChange={(e) => {
                    const value = e.target.value;
                    form.setValue("numberOfPeople", value === '' ? 0 : Number(value));
                  }}
                />
                {form.formState.errors.numberOfPeople && (
                  <p className="text-destructive text-xs font-medium">{form.formState.errors.numberOfPeople.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-14 text-lg font-bold rounded-xl orange-gradient text-white shadow-xl shadow-[var(--terracotta)]/20 hover:scale-[1.02] transition-transform"
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Proceed
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
}
