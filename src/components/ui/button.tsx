import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-3xl text-xl font-bold font-[family-name:var(--font-fredoka)] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-6 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-primary/30 shadow-lg hover:shadow-xl active:scale-95 hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#4ab3e6]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border-4 border-primary bg-white hover:bg-primary/10 text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[#ffc933]",
        success:
          "bg-[#6BCF7F] text-white hover:bg-[#5abf6f]",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-16 px-8 py-4 has-[>svg]:px-6 text-xl",
        sm: "h-12 rounded-2xl gap-2 px-6 has-[>svg]:px-4 text-lg",
        lg: "h-20 rounded-[2rem] px-12 has-[>svg]:px-10 text-2xl",
        xl: "h-24 rounded-[2.5rem] px-16 has-[>svg]:px-14 text-3xl",
        icon: "size-16 rounded-2xl",
        "icon-sm": "size-12 rounded-xl",
        "icon-lg": "size-20 rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
