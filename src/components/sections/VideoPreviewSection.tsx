import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Sparkles } from 'lucide-react'

export function VideoPreviewSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoSrc = '/Untitled video.mp4'

  return (
    <section className="py-20 md:py-32 overflow-hidden">
      <div className="container">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={16} />
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Watch How We Transform <span className="gradient-text">Careers</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get a glimpse of our teaching methodology and see why our alumni land roles at top companies
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Glow Effect Background */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-3xl blur-2xl opacity-50" />
          
          {/* Video Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-secondary shadow-2xl">
            {/* Aspect Ratio Container */}
            <div className="relative aspect-video">
              {/* Thumbnail/Preview */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-secondary">
                  {/* Decorative Glow */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-accent/15 rounded-full blur-3xl" />
                  </div>
                  
                  {/* Preview Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Course Preview Text */}
                    <div className="text-center mb-8">
                      <span className="px-4 py-1.5 bg-primary/20 text-primary text-sm font-medium rounded-full border border-primary/30">
                        Course Preview
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mt-4">
                        AI Product Management
                      </h3>
                      <p className="text-muted-foreground mt-2">Master the future of product</p>
                    </div>

                    {/* Play Button */}
                    <motion.button
                      onClick={() => setIsPlaying(true)}
                      className="group relative"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Play video"
                    >
                      {/* Glow */}
                      <span className="absolute inset-0 rounded-full bg-primary/30 blur-xl group-hover:bg-primary/40 transition-colors" />
                      
                      {/* Button */}
                      <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow">
                        <Play size={28} className="text-white ml-1" fill="currentColor" strokeWidth={0} />
                      </span>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Video Player */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <video
                      src={videoSrc}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                    />
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-foreground hover:bg-black/80 transition-colors z-10"
                      aria-label="Close video"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Bar */}
            <div className="px-6 py-4 border-t border-white/5 bg-secondary/80">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['P', 'R', 'A'].map((initial, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-xs font-semibold text-foreground border-2 border-secondary"
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">500+</span> students enrolled
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-accent">★</span>
                  <span className="text-foreground font-medium">4.9</span>
                  <span className="text-muted-foreground">(120 reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
