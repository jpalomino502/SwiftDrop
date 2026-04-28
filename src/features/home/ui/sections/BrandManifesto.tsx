"use client";

import { motion } from "framer-motion";

export function BrandManifesto() {
    return (
        <section className="px-3 md:px-3 mt-[3px]">
            <motion.div
                className="bg-card py-20 md:py-32 px-6 md:px-20 flex flex-col items-center text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.h2
                    className="text-3xl md:text-4xl lg:text-7xl max-w-5xl"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    No vendemos solo repuestos.
                </motion.h2>

                <motion.h2
                    className="text-3xl md:text-4xl lg:text-5xlf italic max-w-5xl mt-2"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.35, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    Mantienen tu vehiculo en movimiento.
                </motion.h2>

                <motion.div
                    className="w-12 h-px bg-accent mt-10 md:mt-16"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
            </motion.div>
        </section>
    );
};

