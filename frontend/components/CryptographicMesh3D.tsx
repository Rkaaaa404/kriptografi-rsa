'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export function CryptographicMesh3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGlSupported, setWebGlSupported] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 360
    const height = container.clientHeight || 360

    // Scene, Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 5.2

    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'default' })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2))
      container.appendChild(renderer.domElement)
    } catch (err) {
      console.warn('WebGL initialization failed, falling back gracefully:', err)
      setWebGlSupported(false)
      return
    }

    // Geometric Group
    const group = new THREE.Group()
    scene.add(group)

    // Outer Polyhedron Wireframe (Cryptographic Key Vault Symbol)
    const geometry = new THREE.IcosahedronGeometry(1.85, 1)
    const wireframe = new THREE.WireframeGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x008579, // Finpay Teal accent
      transparent: true,
      opacity: 0.35,
    })
    const lines = new THREE.LineSegments(wireframe, lineMaterial)
    group.add(lines)

    // Inner Core (Small Rotating Polyhedron)
    const innerGeometry = new THREE.OctahedronGeometry(0.95, 0)
    const innerWireframe = new THREE.WireframeGeometry(innerGeometry)
    const innerMaterial = new THREE.LineBasicMaterial({
      color: 0x081c26, // Finpay Deep Navy
      transparent: true,
      opacity: 0.75,
    })
    const innerLines = new THREE.LineSegments(innerWireframe, innerMaterial)
    group.add(innerLines)

    // Floating Cryptographic Nodes (Points)
    const nodeCount = 48
    const nodeGeometry = new THREE.BufferGeometry()
    const nodePositions = new Float32Array(nodeCount * 3)

    for (let i = 0; i < nodeCount * 3; i += 3) {
      const radius = 1.85 + (Math.random() - 0.5) * 0.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      nodePositions[i] = radius * Math.sin(phi) * Math.cos(theta)
      nodePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      nodePositions[i + 2] = radius * Math.cos(phi)
    }

    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x008579,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
    })
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial)
    group.add(nodes)

    // Mouse movement interaction
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / (rect.width || 1) - 0.5
      const y = (e.clientY - rect.top) / (rect.height || 1) - 0.5
      targetX = x * 0.8
      targetY = y * 0.8
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation Loop
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth mouse easing
      mouseX += (targetX - mouseX) * 0.05
      mouseY += (targetY - mouseY) * 0.05

      group.rotation.x += 0.003 + mouseY * 0.02
      group.rotation.y += 0.004 + mouseX * 0.02

      innerLines.rotation.x -= 0.005
      innerLines.rotation.y -= 0.005

      if (renderer) {
        renderer.render(scene, camera)
      }
    }

    animate()

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer) return
      const newW = container.clientWidth || 360
      const newH = container.clientHeight || 360
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (renderer) {
        try {
          renderer.dispose()
          renderer.forceContextLoss()
          if (container && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
        } catch {
          // ignore cleanup issues
        }
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-72 sm:h-88 md:h-96 relative flex items-center justify-center select-none animate-scale-in"
    >
      {!webGlSupported && (
        <div className="text-center p-6 text-xs text-slate-400 font-mono">
          [Cryptographic Mesh: WebGL Disabled in Environment]
        </div>
      )}
    </div>
  )
}
