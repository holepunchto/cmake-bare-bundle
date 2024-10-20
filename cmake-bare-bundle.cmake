include_guard()

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

set(bare_bundle_module_dir "${CMAKE_CURRENT_LIST_DIR}")

function(add_bare_bundle)
  cmake_parse_arguments(
    PARSE_ARGV 0 ARGV "SIMULATOR" "ENTRY;OUT;PLATFORM;ARCH;WORKING_DIRECTORY" "DEPENDS"
  )

  if(ARGV_WORKING_DIRECTORY)
    cmake_path(ABSOLUTE_PATH ARGV_WORKING_DIRECTORY BASE_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}" NORMALIZE)
  else()
    set(ARGV_WORKING_DIRECTORY "${CMAKE_CURRENT_LIST_DIR}")
  endif()

  if(ARGV_ENTRY)
    cmake_path(ABSOLUTE_PATH ARGV_ENTRY BASE_DIRECTORY "${ARGV_WORKING_DIRECTORY}" NORMALIZE)
  else()
    message(FATAL_ERROR "Argument ENTRY not provided")
  endif()

  if(ARGV_OUT)
    cmake_path(ABSOLUTE_PATH ARGV_OUT BASE_DIRECTORY "${ARGV_WORKING_DIRECTORY}" NORMALIZE)
  else()
    message(FATAL_ERROR "Argument OUT not provided")
  endif()

  if(NOT DEFINED ARGV_PLATFORM)
    bare_platform(ARGV_PLATFORM)
  endif()

  if(NOT DEFINED ARGV_ARCH)
    bare_arch(ARGV_ARCH)
  endif()

  if(NOT DEFINED ARGV_SIMULATOR)
    bare_simulator(ARGV_SIMULATOR)
  endif()

  list(APPEND ARGV_DEPENDS "${ARGV_ENTRY}")

  list(REMOVE_DUPLICATES ARGV_DEPENDS)

  set(args
    "${ARGV_WORKING_DIRECTORY}"
    "${ARGV_ENTRY}"
    "${ARGV_OUT}"
    "${ARGV_PLATFORM}"
    "${ARGV_ARCH}"
    "$<BOOL:${ARGV_SIMULATOR}>"
  )

  if(CMAKE_HOST_WIN32)
    find_program(
      node
      NAMES node.cmd node
      REQUIRED
    )
  else()
    find_program(
      node
      NAMES node
      REQUIRED
    )
  endif()

  add_custom_command(
    COMMAND "${node}" "${bare_bundle_module_dir}/dependencies.js" ${args}
    WORKING_DIRECTORY "${ARGV_WORKING_DIRECTORY}"
    OUTPUT "${ARGV_OUT}.d"
    DEPENDS ${ARGV_DEPENDS}
    VERBATIM
  )

  add_custom_command(
    COMMAND "${node}" "${bare_bundle_module_dir}/bundle.js" ${args}
    WORKING_DIRECTORY "${ARGV_WORKING_DIRECTORY}"
    OUTPUT "${ARGV_OUT}"
    DEPENDS "${ARGV_OUT}.d"
    DEPFILE "${ARGV_OUT}.d"
    VERBATIM
  )

  if(DEFINED ARGV_UNPARSED_ARGUMENTS)
    list(POP_FRONT ARGV_UNPARSED_ARGUMENTS target)

    add_custom_target(
      ${target}
      ALL
      DEPENDS "${ARGV_OUT}"
    )
  endif()
endfunction()
